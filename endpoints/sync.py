from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database.connection import SessionLocal
from database.models import Job, CV, Match
from ai.sources import fetch_live_jobs, ingest_jobs, recompute_matches_for_new_jobs
from ai.matcher import refresh_idf
from utils.response import success_response, error_response

router = APIRouter(prefix="/sync", tags=["sync"])

# In-memory sync bookkeeping (single-user app, fine for process lifetime)
last_sync: Optional[dict] = None

HIGH_MATCH_THRESHOLD = 80  # % — surfaced as "new high matches" after sync

# --- auto-sync (startup + daily) -------------------------------------------
import os
import sys
import threading
import time
import logging

log = logging.getLogger("jobapply.autosync")

AUTO_SYNC_ENABLED = os.environ.get("JOBAAPPLY_AUTO_SYNC", "1") not in ("0", "false", "no")
AUTO_SYNC_INTERVAL_S = max(1, int(os.environ.get("JOBAAPPLY_SYNC_INTERVAL_HOURS", "24") or 24)) * 3600
BOOT_DELAY_S = 8  # let the server finish booting before the first pull

_auto_state = {"last_run": None, "running": False, "error": None}
_stop_event = threading.Event()


def _high_matches(db: Session, limit: int = 5) -> list:
    """Top scoring matches (>= HIGH_MATCH_THRESHOLD) across parsed CVs,
    for the 'new high-match jobs synced' toast/badge."""
    rows = (
        db.query(Match, Job)
        .join(Job, Match.job_id == Job.id)
        .filter(Match.score >= HIGH_MATCH_THRESHOLD)
        .order_by(Match.score.desc(), Match.id.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "job_id": job.id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "score": m.score,
            "url": job.url,
        }
        for m, job in rows
    ]


def _perform_sync(db: Session, per_source: int = 60) -> dict:
    """Shared sync pipeline for the manual endpoint and the auto-syncer."""
    jobs, source_status = fetch_live_jobs(per_source=per_source)
    if not jobs:
        return {
            "fetched": 0,
            "sources": source_status,
            "synced_at": datetime.utcnow().isoformat() + "Z",
        }

    stats = ingest_jobs(db, jobs)
    refresh_idf(db)
    matches_written = recompute_matches_for_new_jobs(db)

    by_source = dict(
        db.query(Job.source, func.count(Job.id)).group_by(Job.source).all()
    )
    return {
        "fetched": stats["fetched"],
        "created": stats["created"],
        "updated": stats["updated"],
        "skipped": stats["skipped"],
        "matches_scored": matches_written,
        "total_jobs": db.query(Job).count(),
        "by_source": by_source,
        "sources": source_status,
        "synced_at": datetime.utcnow().isoformat() + "Z",
        "high_matches": _high_matches(db),
    }


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/jobs")
def sync_live_jobs(
    per_source: int = Query(60, ge=1, le=100, description="Max jobs fetched per source"),
    db: Session = Depends(get_db),
):
    """Fetch real jobs from keyless public boards, store them, refresh the
    IDF model and score every parsed CV against newly ingested jobs."""
    global last_sync

    result = _perform_sync(db, per_source=per_source)
    if not result.get("fetched"):
        failed = "; ".join(f"{k}: {v}" for k, v in result["sources"].items()) or "no sources attempted"
        return error_response(
            "No live jobs fetched — job boards unreachable. Nothing was changed. (" + failed + ")",
            status_code=502,
        )

    last_sync = result
    return success_response(result, message="Live job sync complete")


@router.get("/status")
def sync_status(db: Session = Depends(get_db)):
    by_source = dict(
        db.query(Job.source, func.count(Job.id)).group_by(Job.source).all()
    )
    parsed_cvs = db.query(CV).filter(CV.status == "parsed").count()
    return success_response({
        "last_sync": last_sync,
        "total_jobs": db.query(Job).count(),
        "cached_matches": db.query(Match).count(),
        "parsed_cvs": parsed_cvs,
        "by_source": by_source,
        "auto_sync": {
            "enabled": AUTO_SYNC_ENABLED,
            "interval_hours": AUTO_SYNC_INTERVAL_S // 3600,
            "last_run": _auto_state["last_run"],
            "running": _auto_state["running"],
            "error": _auto_state["error"],
        },
    })


def _auto_sync_once() -> None:
    """One background sync pass; updates last_sync exactly like a manual sync."""
    global last_sync
    if _auto_state["running"]:
        return
    _auto_state["running"] = True
    db = SessionLocal()
    try:
        result = _perform_sync(db, per_source=60)
        if result.get("fetched"):
            result["auto"] = True
            last_sync = result
            _auto_state["error"] = None
            log.info("auto-sync: %s new jobs, %s scored", result.get("created"), result.get("matches_scored"))
        else:
            _auto_state["error"] = "; ".join(f"{k}: {v}" for k, v in result["sources"].items())
            log.warning("auto-sync fetched nothing: %s", _auto_state["error"])
    except Exception as exc:  # never kill the scheduler thread
        _auto_state["error"] = f"{exc.__class__.__name__}: {exc}"
        log.warning("auto-sync failed: %s", exc)
    finally:
        db.close()
        _auto_state["running"] = False
        _auto_state["last_run"] = datetime.utcnow().isoformat() + "Z"


def start_auto_sync() -> None:
    """Start the background scheduler: one sync shortly after boot, then
    daily. Skipped under pytest or when JOBAAPPLY_AUTO_SYNC=0."""
    if not AUTO_SYNC_ENABLED:
        return
    if "pytest" in sys.modules:  # tests must not hit the network
        return

    def loop():
        _stop_event.wait(BOOT_DELAY_S)
        while not _stop_event.is_set():
            try:
                _auto_sync_once()
            except Exception as exc:  # absolute safety net
                log.warning("auto-sync loop error: %s", exc)
            _stop_event.wait(AUTO_SYNC_INTERVAL_S)

    threading.Thread(target=loop, name="jobapply-auto-sync", daemon=True).start()
    log.info("auto-sync scheduled: first run in %ss, then every %sh", BOOT_DELAY_S, AUTO_SYNC_INTERVAL_S // 3600)


@router.delete("/reset")
def reset_all_data(db: Session = Depends(get_db)):
    """DANGER: wipe ALL user data — CVs, jobs, matches, applications.
    The UI must ask for confirmation before calling this."""
    from database.models import Application

    counts = {
        "applications": db.query(Application).count(),
        "matches": db.query(Match).count(),
        "jobs": db.query(Job).count(),
        "cvs": db.query(CV).count(),
    }
    # children first (FK integrity)
    db.query(Application).delete(synchronize_session=False)
    db.query(Match).delete(synchronize_session=False)
    db.query(Job).delete(synchronize_session=False)
    db.query(CV).delete(synchronize_session=False)
    db.commit()

    # clear in-process AI caches so nothing stale survives the wipe
    from ai import matcher
    matcher._cv_cache.clear()
    matcher._job_cache.clear()
    matcher.refresh_idf(db)

    global last_sync
    last_sync = None
    _auto_state["error"] = None
    return success_response({
        "deleted": counts,
        "message": "All CVs, jobs, matches and applications were permanently deleted.",
    })
