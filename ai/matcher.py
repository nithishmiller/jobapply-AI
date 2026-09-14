"""AI matcher v2 — real-world scoring for the live job engine.

Improvements over v1:
  - canonical skill handling (synonyms: ReactJS == react, K8s == kubernetes ...)
  - IDF weighting: rare skills (kubernetes, pytorch) count more than
    ubiquitous ones (excel, communication)
  - experience-years estimation from CV date ranges, aligned with the
    job's seniority level
  - language/visa awareness without punishing remote roles
  - human-readable "why this score" explanations
"""
import math
import re
from typing import Dict, List, Set, Tuple

from database.models import CV, Job
from ai.skills import canon_skill, extract_skills

# --------------------------------------------------------------------------
# Component weights (sum = 1.0 before practical adjustments)
# --------------------------------------------------------------------------
W_SKILLS = 0.45
W_EDU = 0.15
W_EXP = 0.15
W_KEYWORDS = 0.15
W_FIT = 0.10

# --------------------------------------------------------------------------
# IDF over the job corpus (refreshed after each live sync)
# --------------------------------------------------------------------------
_IDF: Dict[str, float] = {}
_CORPUS_SIZE = 0


def refresh_idf(db) -> None:
    """Recompute IDF weights from the current jobs table."""
    global _IDF, _CORPUS_SIZE
    try:
        jobs = db.query(Job).all()
    except Exception:
        return
    _CORPUS_SIZE = max(len(jobs), 1)
    df: Dict[str, int] = {}
    for job in jobs:
        text = ((job.skills or "") + " " + (job.description or "")).lower()
        seen: Set[str] = set()
        for s in extract_skills(text):
            if s not in seen:
                seen.add(s)
                df[s] = df.get(s, 0) + 1
    _IDF = {
        s: math.log(1.0 + (_CORPUS_SIZE - c + 0.5) / (c + 0.5))
        for s, c in df.items()
    }


def _idf(skill: str) -> float:
    # unknown skills get the highest (rarest) weight
    return _IDF.get(skill, math.log(1.0 + _CORPUS_SIZE + 0.5))


# --------------------------------------------------------------------------
# CV-side caching (extraction over raw_text is expensive)
# --------------------------------------------------------------------------
_cv_cache: Dict[Tuple[int, int], List[str]] = {}


def _cv_skills(cv: CV) -> List[str]:
    key = (cv.id or 0, len(cv.raw_text or ""))
    if key in _cv_cache:
        return _cv_cache[key]
    skills: List[str] = []
    if cv.skills and isinstance(cv.skills, list):
        skills = [canon_skill(s) for s in cv.skills if isinstance(s, str)]
    if not skills and cv.raw_text:
        skills = extract_skills(cv.raw_text[:20000])
    skills = list(dict.fromkeys(skills))
    _cv_cache[key] = skills
    return skills


def _cv_has_german(cv: CV) -> bool:
    if "german" in _cv_skills(cv):
        return True
    return bool(re.search(r"\b(german|deutsch)\b", (cv.raw_text or "")[:8000], re.I))


def _cv_years(cv: CV) -> int:
    """Rough years-of-experience from CV date ranges.
    Dated projects/certifications count too — they matter for entry/junior
    profiles where formal employment history may not exist yet."""
    if not cv.experience or not isinstance(cv.experience, list):
        return 0
    years: List[int] = []
    current_year = 2026
    for item in cv.experience:
        if not isinstance(item, dict):
            continue
        dates = " ".join(str(item.get(k, "")) for k in ("dates", "duration", "period", "start", "end"))
        found = [int(y) for y in re.findall(r"(19|20)\d{2}", dates)]
        if not found:
            continue
        years.extend(found)
        if re.search(r"(present|heute|current|now|bis heute)", dates, re.I):
            years.append(current_year)
    if not years:
        return 0
    span = max(years) - min(years)
    return max(0, min(span, 40))


def _cv_project_years(cv: CV) -> int:
    """Project/training experience estimated from dated education, projects
    and certifications in the raw CV text — fresh grads often list no formal
    jobs but have years of hands-on project work."""
    if not cv.raw_text:
        return 0
    text = cv.raw_text[:12000]
    years = [int(y) for y in re.findall(r"\b(20[0-2]\d)\b", text)]
    if not years:
        return 0
    current_year = 2026
    span = max(years) - min(years)
    # credit time since the most recent date (learning/projects stay current)
    recency = max(0, current_year - max(years))
    return min(max(span, 1 if recency <= 1 else 0) + recency, 8)


# --------------------------------------------------------------------------
# Job-side helpers
# --------------------------------------------------------------------------
_job_cache: Dict[Tuple[int, int], List[str]] = {}


def _job_skills(job: Job) -> List[str]:
    """Canonical skills required by the job (tags + requirements text).
    Cached per (job id, description length) — extraction is the hot path
    when scoring many CVs against the same posting."""
    key = (job.id or 0, len(job.description or ""))
    if key in _job_cache:
        return _job_cache[key]
    text = " ".join(filter(None, [
        job.skills or "",
        job.title or "",
        job.requirements or "",
        (job.description or "")[:4000],
    ]))
    skills = extract_skills(text)
    _job_cache[key] = skills
    return skills


def _job_required_level(job: Job) -> int:
    lvl = (job.experience_level or "").strip().lower()
    if "senior" in lvl or "lead" in lvl:
        return 3
    if "mid" in lvl:
        return 2
    if "entry" in lvl or "junior" in lvl:
        return 1
    return 0


_EDU_LEVELS = {
    "phd": 4, "ph.d": 4, "doctorate": 4,
    "master": 3, "m.a": 3, "m.s": 3, "m.sc": 3, "m.eng": 3, "mba": 3,
    "bachelor": 2, "b.a": 2, "b.s": 2, "b.sc": 2, "b.eng": 2,
    "high school": 1, "secondary": 1, "abitur": 1, "ausbildung": 1,
    "apprenticeship": 1, "vocational": 1,
}


def _cv_edu_level(cv: CV) -> int:
    if not cv.education or not isinstance(cv.education, list):
        return 0
    best = 0
    for edu in cv.education:
        if not isinstance(edu, dict):
            continue
        degree = str(edu.get("degree", "")).lower()
        for key, level in _EDU_LEVELS.items():
            if key in degree:
                best = max(best, level)
                break
    return best


# --------------------------------------------------------------------------
# Main scoring
# --------------------------------------------------------------------------
def compute_match(cv: CV, job: Job) -> Tuple[float, str, List[str], List[str]]:
    """Return (score 0..1, explanation, strengths, gaps)."""
    cv_skills = set(_cv_skills(cv))
    job_skills = _job_skills(job)
    job_set = set(job_skills)

    notes: List[str] = []

    # ---- 1. Weighted skill overlap -------------------------------------
    strengths: List[str] = []
    gaps: List[str] = []
    if job_set:
        matched = cv_skills & job_set
        missing = job_set - cv_skills
        weighted_cov = (
            sum(_idf(s) for s in matched) / sum(_idf(s) for s in job_set)
            if job_set else 0.0
        )
        skill_score = W_SKILLS * weighted_cov
        # rare-skill bonus: a hard-to-find must-have outweighs generic hits
        strengths = sorted(matched, key=_idf, reverse=True)
        gaps = sorted(missing, key=_idf, reverse=True)[:8]
        if matched:
            top = ", ".join(strengths[:4])
            notes.append(f"{len(matched)}/{len(job_set)} key skills matched ({top})")
        else:
            notes.append("no required skills found in CV")
    else:
        skill_score = 0.0
        notes.append("job lists no explicit skills")

    # ---- 2. Education ---------------------------------------------------
    cv_edu = _cv_edu_level(cv)
    job_edu = 0  # live postings rarely declare a level; neutral 50%
    if job_edu:
        edu_score = W_EDU if cv_edu >= job_edu else W_EDU * (cv_edu / job_edu)
        notes.append(f"education: CV level {cv_edu} vs required {job_edu}")
    else:
        edu_score = W_EDU * (0.5 + 0.1 * cv_edu)  # more education, slightly better
        notes.append("education requirement not specified")

    # ---- 3. Experience --------------------------------------------------
    years = _cv_years(cv)
    project_years = _cv_project_years(cv)
    effective_years = max(years, project_years)
    required_level = _job_required_level(job)
    min_years = {0: 0, 1: 0, 2: 2, 3: 5}.get(required_level, 0)
    if min_years == 0:
        exp_score = W_EXP * (0.7 if effective_years > 0 else 0.4)
        notes.append(f"~{effective_years}y experience incl. projects" if effective_years else "no dated experience found")
    elif effective_years >= min_years:
        exp_score = W_EXP
        notes.append(f"~{effective_years}y experience (incl. projects) meets {min_years}y+ expectation")
    else:
        exp_score = W_EXP * max(0.25, effective_years / min_years)
        notes.append(f"~{effective_years}y vs ~{min_years}y expected")

    # ---- 4. Keyword coverage in description -----------------------------
    if cv_skills:
        desc = ((job.description or "") + " " + (job.requirements or "")).lower()
        hits = sum(1 for s in cv_skills if s in desc)
        kw_score = W_KEYWORDS * (hits / len(cv_skills))
        notes.append(f"{hits}/{len(cv_skills)} CV skills appear in the posting")
    else:
        kw_score = 0.0

    # ---- 5. Practical fit (language / visa / relocation) ----------------
    fit_score = W_FIT
    lang = (job.language_requirements or "").lower()
    if "german (required)" in lang and not _cv_has_german(cv):
        fit_score -= 0.07
        notes.append("German required but not found in CV")
    if job.visa_sponsorship:
        fit_score += 0.03
        notes.append("visa sponsorship available")
    if job.relocation_support:
        fit_score += 0.02
        notes.append("relocation support offered")

    score = skill_score + edu_score + exp_score + kw_score + fit_score
    score = max(0.0, min(1.0, score))

    explanation = "; ".join(notes)
    return score, explanation, strengths, gaps


def get_match_for_cv_job(cv_id: int, job_id: int, db):
    cv = db.query(CV).filter(CV.id == cv_id).first()
    job = db.query(Job).filter(Job.id == job_id).first()
    if not cv:
        raise ValueError(f"CV with id {cv_id} not found")
    if not job:
        raise ValueError(f"Job with id {job_id} not found")
    return compute_match(cv, job)
