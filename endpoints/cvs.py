from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import SessionLocal
from database.models import CV, Match, Application
from ai.parser import CVParser
from utils.response import success_response, error_response
import os

router = APIRouter(prefix="/cvs", tags=["cvs"])
parser = CVParser()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_cvs(db: Session = Depends(get_db)):
    cvs = db.query(CV).all()
    return success_response([{
        "id": cv.id,
        "filename": cv.filename,
        "file_path": cv.file_path,
        "upload_date": cv.upload_date.isoformat(),
        "status": cv.status,
        "parsed": bool(cv.raw_text)  # Indicate if CV has been parsed
    } for cv in cvs])

@router.get("/{cv_id}")
def get_cv(cv_id: int, db: Session = Depends(get_db)):
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    return success_response({
        "id": cv.id,
        "filename": cv.filename,
        "file_path": cv.file_path,
        "upload_date": cv.upload_date.isoformat(),
        "status": cv.status,
        "contact_info": cv.contact_info,
        "education": cv.education,
        "experience": cv.experience,
        "skills": cv.skills,
        "has_raw_text": bool(cv.raw_text)
    })


@router.delete("/{cv_id}")
def delete_cv(cv_id: int, db: Session = Depends(get_db)):
    """Delete a CV and everything that belongs to it (matches,
    applications) plus the uploaded file on disk."""
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")

    deleted_children = {
        "matches": db.query(Match).filter(Match.cv_id == cv_id).count(),
        "applications": db.query(Application).filter(Application.cv_id == cv_id).count(),
    }
    # children first, then the CV (no FK orphan rows)
    db.query(Match).filter(Match.cv_id == cv_id).delete(synchronize_session=False)
    db.query(Application).filter(Application.cv_id == cv_id).delete(synchronize_session=False)
    db.delete(cv)
    db.commit()

    # best-effort file cleanup — the DB row is the source of truth
    try:
        if cv.file_path and Path(cv.file_path).exists():
            Path(cv.file_path).unlink()
    except OSError:
        pass

    # in-process matcher cache may hold stale skills for this CV
    from ai import matcher
    for key in [k for k in matcher._cv_cache if k[0] == cv_id]:
        matcher._cv_cache.pop(key, None)

    return success_response({
        "message": f"CV '{cv.filename}' deleted",
        "deleted_cv_id": cv_id,
        **deleted_children,
    })