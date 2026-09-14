from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from database.connection import SessionLocal
from database.models import Application, Job, CV
from utils.response import success_response, error_response

router = APIRouter(prefix="/applications", tags=["applications"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _serialize_application(app: Application) -> dict:
    """Serialize an application with joined job + cv details for the dashboard."""
    return {
        "id": app.id,
        "cv_id": app.cv_id,
        "job_id": app.job_id,
        "status": app.status,
        "applied_at": app.applied_at.isoformat() if app.applied_at else None,
        "notes": app.notes,
        "cover_letter_text": app.cover_letter_text,
        "created_at": app.created_at.isoformat() if app.created_at else None,
        "updated_at": app.updated_at.isoformat() if app.updated_at else None,
        "job": {
            "id": app.job.id,
            "title": app.job.title,
            "company": app.job.company,
            "location": app.job.location,
            "country": app.job.country,
            "remote": app.job.remote,
        } if app.job else None,
        "cv": {
            "id": app.cv.id,
            "filename": app.cv.filename,
        } if app.cv else None,
    }


@router.get("/")
def get_applications(db: Session = Depends(get_db)):
    applications = (
        db.query(Application)
        .options(joinedload(Application.job), joinedload(Application.cv))
        .order_by(Application.applied_at.desc(), Application.id.desc())
        .all()
    )
    return success_response([_serialize_application(app) for app in applications])

@router.get("/{application_id}")
def get_application(application_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return success_response({
        "id": app.id,
        "cv_id": app.cv_id,
        "job_id": app.job_id,
        "status": app.status,
        "applied_at": app.applied_at.isoformat() if app.applied_at else None,
        "notes": app.notes,
        "cover_letter_text": app.cover_letter_text if hasattr(app, 'cover_letter_text') else None,
        "created_at": app.created_at.isoformat() if app.created_at else None,
        "updated_at": app.updated_at.isoformat() if app.updated_at else None
    })

@router.post("/")
def create_application(application: dict, db: Session = Depends(get_db)):
    # Validate required fields
    if not application.get("cv_id"):
        raise HTTPException(status_code=400, detail="cv_id is required")
    if not application.get("job_id"):
        raise HTTPException(status_code=400, detail="job_id is required")
    # Optionally verify that cv_id and job_id exist
    cv = db.query(CV).filter(CV.id == application["cv_id"]).first()
    if not cv:
        raise HTTPException(status_code=400, detail="Invalid cv_id")
    job = db.query(Job).filter(Job.id == application["job_id"]).first()
    if not job:
        raise HTTPException(status_code=400, detail="Invalid job_id")
    db_application = Application(
        cv_id=application["cv_id"],
        job_id=application["job_id"],
        status=application.get("status", "applied"),
        applied_at=application.get("applied_at"),
        notes=application.get("notes"),
        cover_letter_text=application.get("cover_letter_text", None)
    )
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return success_response({
        "id": db_application.id,
        "cv_id": db_application.cv_id,
        "job_id": db_application.job_id,
        "status": db_application.status,
        "applied_at": db_application.applied_at.isoformat() if db_application.applied_at else None,
        "notes": db_application.notes,
        "created_at": db_application.created_at.isoformat() if db_application.created_at else None,
        "updated_at": db_application.updated_at.isoformat() if db_application.updated_at else None
    }, status_code=201)

@router.put("/{application_id}")
def update_application(application_id: int, application: dict, db: Session = Depends(get_db)):
    db_application = db.query(Application).filter(Application.id == application_id).first()
    if not db_application:
        raise HTTPException(status_code=404, detail="Application not found")
    # Update fields
    if "cv_id" in application:
        cv = db.query(CV).filter(CV.id == application["cv_id"]).first()
        if not cv:
            raise HTTPException(status_code=400, detail="Invalid cv_id")
        db_application.cv_id = application["cv_id"]
    if "job_id" in application:
        job = db.query(Job).filter(Job.id == application["job_id"]).first()
        if not job:
            raise HTTPException(status_code=400, detail="Invalid job_id")
        db_application.job_id = application["job_id"]
    if "status" in application:
        db_application.status = application["status"]
    if "applied_at" in application:
        db_application.applied_at = application["applied_at"]
    if "notes" in application:
        db_application.notes = application["notes"]
    if "cover_letter_text" in application:
        db_application.cover_letter_text = application["cover_letter_text"]
    db.commit()
    db.refresh(db_application)
    return success_response({
        "id": db_application.id,
        "cv_id": db_application.cv_id,
        "job_id": db_application.job_id,
        "status": db_application.status,
        "applied_at": db_application.applied_at.isoformat() if db_application.applied_at else None,
        "notes": db_application.notes,
        "created_at": db_application.created_at.isoformat() if db_application.created_at else None,
        "updated_at": db_application.updated_at.isoformat() if db_application.updated_at else None
    })

@router.delete("/{application_id}")
def delete_application(application_id: int, db: Session = Depends(get_db)):
    db_application = db.query(Application).filter(Application.id == application_id).first()
    if not db_application:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(db_application)
    db.commit()
    return success_response({"message": "Application deleted successfully"})