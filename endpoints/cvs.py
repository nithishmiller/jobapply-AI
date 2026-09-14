from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import SessionLocal
from database.models import CV
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