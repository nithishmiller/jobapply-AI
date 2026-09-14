"""Live job ingestion from keyless public job-board APIs.

Sources:
  - Arbeitnow Germany board  (https://www.arbeitnow.com/api/job-board-api)
  - Remotive remote board    (https://remotive.com/api/remote-jobs)

Both are free and keyless. Jobs are normalized into the existing `jobs`
table, de-duplicated by URL, and every parsed CV gets fresh match scores
against newly ingested jobs.
"""
import logging
import re
from datetime import datetime, timezone
from typing import Dict, List, Optional

import httpx
from sqlalchemy.orm import Session

from database.models import CV, Job, Match
from ai.matcher import compute_match
from ai.skills import (
    detect_experience_level,
    detect_language_requirements,
    detect_relocation_support,
    detect_visa_sponsorship,
    extract_skills,
    html_to_text,
    parse_salary,
)

log = logging.getLogger("jobapply.sources")

ARBEITNOW_URL = "https://www.arbeitnow.com/api/job-board-api"
REMOTIVE_URL = "https://remotive.com/api/remote-jobs"

HTTP_HEADERS = {"User-Agent": "JobApplyAI/2.0 (personal job-search assistant)"}
FETCH_TIMEOUT = 20.0
MAX_JOBS_PER_SOURCE = 60  # per sync call, per source

SENIOR_RE = re.compile(r"\b(senior|sr\.?|lead|principal|staff|head of)\b", re.I)


# --------------------------------------------------------------------------
# Normalization helpers
# --------------------------------------------------------------------------
def _clean_company(name: Optional[str]) -> str:
    n = (name or "").strip()
    n = re.sub(r"\s*\(via .*?\)\s*$", "", n, flags=re.I)
    return n or "Unknown company"


def _title_is_senior(title: str) -> bool:
    return bool(SENIOR_RE.search(title or ""))


def _split_location(loc: Optional[str]) -> Dict[str, Optional[str]]:
    """'Berlin, Germany' -> {location: Berlin, country: Germany}"""
    if not loc:
        return {"location": None, "country": None}
    parts = [p.strip() for p in loc.split(",") if p.strip()]
    if len(parts) >= 2:
        return {"location": parts[0], "country": parts[-1]}
    return {"location": loc.strip(), "country": None}


# --------------------------------------------------------------------------
# Source adapters -> normalized dicts
# --------------------------------------------------------------------------
def _map_arbeitnow(items: List[dict]) -> List[dict]:
    out = []
    for it in items or []:
        slug = it.get("slug") or ""
        url = it.get("url") or (f"https://www.arbeitnow.com/view-job/{slug}" if slug else None)
        if not url:
            continue
        desc = html_to_text(it.get("description"))
        tags = it.get("tags") or []
        title = (it.get("title") or "").strip()
        loc = _split_location(it.get("location"))
        skills = extract_skills(desc + " " + title, extra_tags=tags)
        posted = it.get("created_at")
        out.append({
            "title": title or "Untitled role",
            "company": _clean_company(it.get("company_name")),
            "location": loc["location"],
            "country": loc["country"] or "Germany",
            "remote": bool(it.get("remote")),
            "employment_type": None,
            "salary": None,
            "salary_min": None,
            "salary_max": None,
            "currency": None,
            "description": desc[:6000] or None,
            "requirements": None,
            "preferred_requirements": None,
            "skills": ", ".join(skills) if skills else None,
            "url": url,
            "source": "arbeitnow",
            "posted_date": None,  # filled below from created_at
            "_posted_ts": posted,
            "language_requirements": detect_language_requirements(desc),
            "experience_level": detect_experience_level(title, desc),
            "visa_sponsorship": detect_visa_sponsorship(desc),
            "relocation_support": detect_relocation_support(desc),
        })
    return out


def _map_remotive(payload: dict) -> List[dict]:
    out = []
    for it in (payload or {}).get("jobs") or []:
        url = it.get("url")
        if not url:
            continue
        desc = html_to_text(it.get("description"))
        tags = it.get("tags") or []
        title = (it.get("title") or "").strip()
        salary_raw = (it.get("salary") or "").strip() or None
        smin, smax, cur = parse_salary(salary_raw)
        skills = extract_skills(desc + " " + title, extra_tags=tags)
        out.append({
            "title": title or "Untitled role",
            "company": _clean_company(it.get("company_name")),
            "location": "Remote",
            "country": None,
            "remote": True,
            "employment_type": (it.get("job_type") or "").strip() or None,
            "salary": salary_raw,
            "salary_min": smin,
            "salary_max": smax,
            "currency": cur if (smin or smax) else None,
            "description": desc[:6000] or None,
            "requirements": None,
            "preferred_requirements": None,
            "skills": ", ".join(skills) if skills else None,
            "url": url,
            "source": "remotive",
            "posted_date": None,
            "_posted_ts": it.get("publication_date"),
            "language_requirements": detect_language_requirements(desc),
            "experience_level": detect_experience_level(title, desc),
            "visa_sponsorship": detect_visa_sponsorship(desc),
            "relocation_support": detect_relocation_support(desc),
        })
    return out


def _parse_ts(raw) -> Optional[datetime]:
    if not raw:
        return None
    try:
        s = str(raw).replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        if dt.tzinfo:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt
    except (ValueError, TypeError):
        return None


# --------------------------------------------------------------------------
# Fetch
# --------------------------------------------------------------------------
def _fetch_json(client: httpx.Client, url: str, params: Optional[dict] = None) -> tuple:
    """Returns (payload, error_message). Exactly one is None."""
    try:
        r = client.get(url, params=params, headers=HTTP_HEADERS, timeout=FETCH_TIMEOUT)
        r.raise_for_status()
        return r.json(), None
    except Exception as exc:  # network/parse errors must not kill the sync
        log.warning("Fetch failed for %s: %s", url, exc)
        return None, f"{exc.__class__.__name__}: {exc}"


def fetch_live_jobs(per_source: int = MAX_JOBS_PER_SOURCE) -> tuple:
    """Fetch and normalize jobs from all sources. Never raises.
    Returns (jobs, source_status) where source_status records exactly what
    happened per source — the UI surfaces failures instead of silently
    falling back to whatever is already in the DB."""
    jobs: List[dict] = []
    source_status: Dict[str, str] = {}

    try:
        with httpx.Client(follow_redirects=True) as client:
            data, err = _fetch_json(client, ARBEITNOW_URL)
            if err:
                source_status["arbeitnow"] = f"FAILED — {err}"
            elif data and isinstance(data.get("data"), list):
                n = _map_arbeitnow(data["data"][:per_source])
                jobs.extend(n)
                source_status["arbeitnow"] = f"OK — {len(n)} jobs"
            else:
                source_status["arbeitnow"] = "FAILED — unexpected response shape"

            data, err = _fetch_json(client, REMOTIVE_URL, params={"limit": per_source})
            if err:
                source_status["remotive"] = f"FAILED — {err}"
            elif data and isinstance(data.get("jobs"), list):
                n = _map_remotive(data)
                jobs.extend(n)
                source_status["remotive"] = f"OK — {len(n)} jobs"
            else:
                source_status["remotive"] = "FAILED — unexpected response shape"
    except Exception as exc:
        log.warning("Live sync error: %s", exc)
        source_status["transport"] = f"FAILED — {exc}"

    for j in jobs:
        j["posted_date"] = _parse_ts(j.pop("_posted_ts", None))
    return jobs, source_status


# --------------------------------------------------------------------------
# Persist (dedupe by URL; refresh skills for changed posts)
# --------------------------------------------------------------------------
def _existing_url_set(db: Session) -> Dict[str, Job]:
    return {j.url: j for j in db.query(Job).filter(Job.url.isnot(None)).all()}


def ingest_jobs(db: Session, jobs: List[dict]) -> Dict[str, int]:
    """Insert new jobs / update known ones. Returns counters."""
    existing = _existing_url_set(db)
    created = updated = skipped = 0

    for j in jobs:
        url = j["url"]
        row = existing.get(url)
        if row is None:
            row = Job(
                title=j["title"], company=j["company"], location=j["location"],
                country=j["country"], state=None, remote=j["remote"],
                employment_type=j["employment_type"], salary=j["salary"],
                salary_min=j["salary_min"], salary_max=j["salary_max"],
                currency=j["currency"], description=j["description"],
                requirements=j["requirements"],
                preferred_requirements=j["preferred_requirements"],
                skills=j["skills"], url=url, source=j["source"],
                posted_date=j["posted_date"],
                language_requirements=j["language_requirements"],
                experience_level=j["experience_level"],
                visa_sponsorship=j["visa_sponsorship"],
                relocation_support=j["relocation_support"],
            )
            db.add(row)
            existing[url] = row
            created += 1
        else:
            changed = False
            for field in ("title", "company", "description", "skills",
                          "experience_level", "language_requirements",
                          "visa_sponsorship", "relocation_support"):
                new_val = j.get(field)
                if new_val and getattr(row, field) != new_val:
                    setattr(row, field, new_val)
                    changed = True
            if changed:
                updated += 1
            else:
                skipped += 1

    db.commit()
    return {"created": created, "updated": updated, "skipped": skipped,
            "fetched": len(jobs)}


def recompute_matches_for_new_jobs(db: Session, limit_per_cv: int = 200) -> int:
    """(Re)score matches for every parsed CV against jobs lacking a cached
    match. Returns number of match rows written."""
    written = 0
    cvs = db.query(CV).filter(CV.status == "parsed").all()
    if not cvs:
        return 0
    for cv in cvs:
        scored_job_ids = {
            m.job_id for m in db.query(Match).filter(Match.cv_id == cv.id).all()
        }
        pending = (
            db.query(Job)
            .filter(~Job.id.in_(scored_job_ids) if scored_job_ids else Job.id.isnot(None))
            .order_by(Job.id.desc())  # newest postings first
            .limit(limit_per_cv)
            .all()
        )
        for job in pending:
            try:
                score, explanation, strengths, gaps = compute_match(cv, job)
                db.add(Match(
                    cv_id=cv.id, job_id=job.id,
                    score=int(round(score * 100)),
                    explanation=explanation,
                    strengths=strengths, gaps=gaps,
                ))
                written += 1
            except Exception as exc:
                log.warning("Match failed cv=%s job=%s: %s", cv.id, job.id, exc)
    db.commit()
    return written
