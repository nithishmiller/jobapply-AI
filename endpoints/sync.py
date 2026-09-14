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

    jobs, source_status = fetch_live_jobs(per_source=per_source)
    if not jobs:
        failed = "; ".join(f"{k}: {v}" for k, v in source_status.items()) or "no sources attempted"
        return error_response(
            "No live jobs fetched — job boards unreachable. Nothing was changed. (" + failed + ")",
            status_code=502,
        )

    stats = ingest_jobs(db, jobs)
    refresh_idf(db)
    matches_written = recompute_matches_for_new_jobs(db)

    by_source = dict(
        db.query(Job.source, func.count(Job.id)).group_by(Job.source).all()
    )
    result = {
        "fetched": stats["fetched"],
        "created": stats["created"],
        "updated": stats["updated"],
        "skipped": stats["skipped"],
        "matches_scored": matches_written,
        "total_jobs": db.query(Job).count(),
        "by_source": by_source,
        "sources": source_status,
        "synced_at": datetime.utcnow().isoformat() + "Z",
    }
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
    })


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
    return success_response({
        "deleted": counts,
        "message": "All CVs, jobs, matches and applications were permanently deleted.",
    })
