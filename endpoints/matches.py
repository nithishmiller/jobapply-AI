from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database.connection import SessionLocal
from database.models import Match, Job, CV
from ai.matcher import get_match_for_cv_job
from utils.response import success_response, error_response
from typing import Optional, List
import json

router = APIRouter(prefix="/matches", tags=["matches"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_matches(
    db: Session = Depends(get_db),
    sort_by: str = Query("score", description="Field to sort by (score, cv_id, job_id, created_at)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    min_score: Optional[int] = Query(None, description="Minimum score (0-100) to filter matches")
):
    # Validate sort_by field
    allowed_sort_fields = ["score", "cv_id", "job_id", "created_at"]
    if sort_by not in allowed_sort_fields:
        sort_by = "score"  # default to score if invalid field

    # Validate sort_order
    if sort_order not in ["asc", "desc"]:
        sort_order = "desc"  # default to desc

    # Build query
    query = db.query(Match)

    # Apply min_score filter if provided
    if min_score is not None:
        query = query.filter(Match.score >= min_score)

    # Apply sorting
    if sort_order == "desc":
        query = query.order_by(getattr(Match, sort_by).desc())
    else:
        query = query.order_by(getattr(Match, sort_by).asc())

    matches = query.all()
    return success_response([{
        "id": m.id,
        "cv_id": m.cv_id,
        "job_id": m.job_id,
        "score": m.score,
        "explanation": m.explanation,
        "strengths": m.strengths,
        "gaps": m.gaps,
        "created_at": m.created_at.isoformat() if m.created_at else None
    } for m in matches])

@router.post("/")
def create_match(match_data: dict, db: Session = Depends(get_db)):
    # Expect cv_id and job_id
    cv_id = match_data.get("cv_id")
    job_id = match_data.get("job_id")
    if cv_id is None or job_id is None:
        raise HTTPException(status_code=400, detail="cv_id and job_id are required")
    # Compute match
    try:
        score, explanation, strengths, gaps = get_match_for_cv_job(cv_id, job_id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    # Check if match already exists (optional, we can allow duplicates or prevent)
    existing = db.query(Match).filter(Match.cv_id == cv_id, Match.job_id == job_id).first()
    if existing:
        # Update existing
        existing.score = int(score * 100) if score is not None else None
        existing.explanation = explanation
        existing.strengths = strengths
        existing.gaps = gaps
        db.commit()
        db.refresh(existing)
        return success_response({
            "id": existing.id,
            "cv_id": existing.cv_id,
            "job_id": existing.job_id,
            "score": existing.score,
            "explanation": existing.explanation,
            "strengths": existing.strengths,
            "gaps": existing.gaps,
            "created_at": existing.created_at.isoformat() if existing.created_at else None
        })
    else:
        db_match = Match(
            cv_id=cv_id,
            job_id=job_id,
            score=int(score * 100) if score is not None else None,
            explanation=explanation,
            strengths=strengths,
            gaps=gaps
        )
        db.add(db_match)
        db.commit()
        db.refresh(db_match)
        return success_response({
            "id": db_match.id,
            "cv_id": db_match.cv_id,
            "job_id": db_match.job_id,
            "score": db_match.score,
            "explanation": db_match.explanation,
            "strengths": db_match.strengths,
            "gaps": db_match.gaps,
            "created_at": db_match.created_at.isoformat() if db_match.created_at else None
        }, status_code=201)

@router.get("/cv/{cv_id}")
def get_matches_for_cv(cv_id: int, db: Session = Depends(get_db)):
    matches = db.query(Match).filter(Match.cv_id == cv_id).all()
    return success_response([{
        "id": m.id,
        "cv_id": m.cv_id,
        "job_id": m.job_id,
        "score": m.score,
        "explanation": m.explanation,
        "strengths": m.strengths,
        "gaps": m.gaps,
        "created_at": m.created_at.isoformat() if m.created_at else None
    } for m in matches])

@router.get("/job/{job_id}")
def get_matches_for_job(job_id: int, db: Session = Depends(get_db)):
    matches = db.query(Match).filter(Match.job_id == job_id).all()
    return success_response([{
        "id": m.id,
        "cv_id": m.cv_id,
        "job_id": m.job_id,
        "score": m.score,
        "explanation": m.explanation,
        "strengths": m.strengths,
        "gaps": m.gaps,
        "created_at": m.created_at.isoformat() if m.created_at else None
    } for m in matches])

@router.delete("/{match_id}")
def delete_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    db.delete(match)
    db.commit()
    return success_response({"message": "Match deleted successfully"})


@router.get("/recommendations/{cv_id}")
def get_job_recommendations_for_cv(
    cv_id: int,
    db: Session = Depends(get_db),
    limit: int = Query(10, description="Maximum number of recommendations to return"),
    min_score: int = Query(0, description="Minimum match score (0-100) to include in recommendations")
):
    """
    Get job recommendations for a CV, ranked by match score.
    Returns jobs with their match details, sorted by score descending.
    """
    # Verify CV exists
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")

    # Get all jobs
    jobs = db.query(Job).all()

    recommendations = []

    for job in jobs:
        try:
            # Compute match
            score, explanation, strengths, gaps = get_match_for_cv_job(cv.id, job.id, db)

            # Convert score to 0-100 scale
            score_100 = int(score * 100) if score is not None else 0

            # Filter by minimum score
            if score_100 >= min_score:
                recommendations.append({
                    "job": {
                        "id": job.id,
                        "title": job.title,
                        "company": job.company,
                        "location": job.location,
                        "country": job.country,
                        "state": job.state,
                        "remote": job.remote,
                        "employment_type": job.employment_type,
                        "salary": job.salary,
                        "salary_min": job.salary_min,
                        "salary_max": job.salary_max,
                        "currency": job.currency,
                        "description": job.description,
                        "requirements": job.requirements,
                        "preferred_requirements": job.preferred_requirements,
                        "skills": job.skills,
                        "url": job.url,
                        "source": job.source,
                        "posted_date": job.posted_date.isoformat() if job.posted_date else None,
                        "language_requirements": job.language_requirements,
                        "experience_level": job.experience_level,
                        "visa_sponsorship": job.visa_sponsorship,
                        "relocation_support": job.relocation_support,
                        "created_at": job.created_at.isoformat() if job.created_at else None
                    },
                    "match": {
                        "score": score_100,
                        "explanation": explanation,
                        "strengths": strengths,
                        "gaps": gaps
                    }
                })
        except Exception as e:
            # Skip jobs that cause errors in matching
            print(f"Error computing match for CV {cv_id} and Job {job.id}: {e}")
            continue

    # Sort by score descending
    recommendations.sort(key=lambda x: x["match"]["score"], reverse=True)

    # Limit results
    recommendations = recommendations[:limit]

    return success_response(recommendations)


@router.get("/reverse-recommendations/{job_id}")
def get_cv_recommendations_for_job(
    job_id: int,
    db: Session = Depends(get_db),
    limit: int = Query(10, description="Maximum number of recommendations to return"),
    min_score: int = Query(0, description="Minimum match score (0-100) to include in recommendations")
):
    """
    Get CV recommendations for a job, ranked by match score.
    Returns CVs with their match details, sorted by score descending.
    """
    # Verify job exists
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Get all CVs
    cvs = db.query(CV).all()

    recommendations = []

    for cv in cvs:
        try:
            # Compute match
            score, explanation, strengths, gaps = get_match_for_cv_job(cv.id, job.id, db)

            # Convert score to 0-100 scale
            score_100 = int(score * 100) if score is not None else 0

            # Filter by minimum score
            if score_100 >= min_score:
                recommendations.append({
                    "cv": {
                        "id": cv.id,
                        "filename": cv.filename,
                        "file_path": cv.file_path,
                        "upload_date": cv.upload_date.isoformat(),
                        "status": cv.status,
                        "contact_info": cv.contact_info,
                        "education": cv.education,
                        "experience": cv.experience,
                        "skills": cv.skills,
                        "raw_text": cv.raw_text
                    },
                    "match": {
                        "score": score_100,
                        "explanation": explanation,
                        "strengths": strengths,
                        "gaps": gaps
                    }
                })
        except Exception as e:
            # Skip CVs that cause errors in matching
            print(f"Error computing match for CV {cv.id} and Job {job_id}: {e}")
            continue

    # Sort by score descending
    recommendations.sort(key=lambda x: x["match"]["score"], reverse=True)

    # Limit results
    recommendations = recommendations[:limit]

    return success_response(recommendations)


# NOTE: this route must be registered AFTER the literal sub-paths above
# ("/cv/{cv_id}", "/job/{job_id}", "/recommendations/{cv_id}",
# "/reverse-recommendations/{job_id}") or FastAPI would try to parse
# those literals as an int and shadow them with 422 errors.
@router.get("/{match_id}")
def get_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return success_response({
        "id": match.id,
        "cv_id": match.cv_id,
        "job_id": match.job_id,
        "score": match.score,
        "explanation": match.explanation,
        "strengths": match.strengths,
        "gaps": match.gaps,
        "created_at": match.created_at.isoformat() if match.created_at else None
    })