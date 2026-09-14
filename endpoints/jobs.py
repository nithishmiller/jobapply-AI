from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.connection import SessionLocal
from database.models import Job
from utils.response import success_response, error_response

router = APIRouter(prefix="/jobs", tags=["jobs"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).all()
    return success_response([{
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
    } for job in jobs])

@router.get("/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return success_response({
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
    })

@router.post("/")
def create_job(job: dict, db: Session = Depends(get_db)):
    # Validate required fields
    if not job.get("title"):
        raise HTTPException(status_code=400, detail="Title is required")
    # Create job object
    db_job = Job(
        title=job.get("title"),
        company=job.get("company"),
        location=job.get("location"),
        country=job.get("country"),
        state=job.get("state"),
        remote=job.get("remote", False),
        employment_type=job.get("employment_type"),
        salary=job.get("salary"),
        salary_min=job.get("salary_min"),
        salary_max=job.get("salary_max"),
        currency=job.get("currency"),
        description=job.get("description"),
        requirements=job.get("requirements"),
        preferred_requirements=job.get("preferred_requirements"),
        skills=job.get("skills"),
        url=job.get("url"),
        source=job.get("source"),
        posted_date=job.get("posted_date"),
        language_requirements=job.get("language_requirements"),
        experience_level=job.get("experience_level"),
        visa_sponsorship=job.get("visa_sponsorship", False),
        relocation_support=job.get("relocation_support", False)
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return success_response({
        "id": db_job.id,
        "title": db_job.title,
        "company": db_job.company,
        "location": db_job.location,
        "country": db_job.country,
        "state": db_job.state,
        "remote": db_job.remote,
        "employment_type": db_job.employment_type,
        "salary": db_job.salary,
        "salary_min": db_job.salary_min,
        "salary_max": db_job.salary_max,
        "currency": db_job.currency,
        "description": db_job.description,
        "requirements": db_job.requirements,
        "preferred_requirements": db_job.preferred_requirements,
        "skills": db_job.skills,
        "url": db_job.url,
        "source": db_job.source,
        "posted_date": db_job.posted_date.isoformat() if db_job.posted_date else None,
        "language_requirements": db_job.language_requirements,
        "experience_level": db_job.experience_level,
        "visa_sponsorship": db_job.visa_sponsorship,
        "relocation_support": db_job.relocation_support,
        "created_at": db_job.created_at.isoformat() if db_job.created_at else None
    }, status_code=201)

@router.put("/{job_id}")
def update_job(job_id: int, job: dict, db: Session = Depends(get_db)):
    db_job = db.query(Job).filter(Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    # Update fields
    if "title" in job:
        db_job.title = job["title"]
    if "company" in job:
        db_job.company = job["company"]
    if "location" in job:
        db_job.location = job["location"]
    if "country" in job:
        db_job.country = job["country"]
    if "state" in job:
        db_job.state = job["state"]
    if "remote" in job:
        db_job.remote = job["remote"]
    if "employment_type" in job:
        db_job.employment_type = job["employment_type"]
    if "salary" in job:
        db_job.salary = job["salary"]
    if "salary_min" in job:
        db_job.salary_min = job["salary_min"]
    if "salary_max" in job:
        db_job.salary_max = job["salary_max"]
    if "currency" in job:
        db_job.currency = job["currency"]
    if "description" in job:
        db_job.description = job["description"]
    if "requirements" in job:
        db_job.requirements = job["requirements"]
    if "preferred_requirements" in job:
        db_job.preferred_requirements = job["preferred_requirements"]
    if "skills" in job:
        db_job.skills = job["skills"]
    if "url" in job:
        db_job.url = job["url"]
    if "source" in job:
        db_job.source = job["source"]
    if "posted_date" in job:
        db_job.posted_date = job["posted_date"]
    if "language_requirements" in job:
        db_job.language_requirements = job["language_requirements"]
    if "experience_level" in job:
        db_job.experience_level = job["experience_level"]
    if "visa_sponsorship" in job:
        db_job.visa_sponsorship = job["visa_sponsorship"]
    if "relocation_support" in job:
        db_job.relocation_support = job["relocation_support"]
    db.commit()
    db.refresh(db_job)
    return success_response({
        "id": db_job.id,
        "title": db_job.title,
        "company": db_job.company,
        "location": db_job.location,
        "country": db_job.country,
        "state": db_job.state,
        "remote": db_job.remote,
        "employment_type": db_job.employment_type,
        "salary": db_job.salary,
        "salary_min": db_job.salary_min,
        "salary_max": db_job.salary_max,
        "currency": db_job.currency,
        "description": db_job.description,
        "requirements": db_job.requirements,
        "preferred_requirements": db_job.preferred_requirements,
        "skills": db_job.skills,
        "url": db_job.url,
        "source": db_job.source,
        "posted_date": db_job.posted_date.isoformat() if db_job.posted_date else None,
        "language_requirements": db_job.language_requirements,
        "experience_level": db_job.experience_level,
        "visa_sponsorship": db_job.visa_sponsorship,
        "relocation_support": db_job.relocation_support,
        "created_at": db_job.created_at.isoformat() if db_job.created_at else None
    })

@router.delete("/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    db_job = db.query(Job).filter(Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(db_job)
    db.commit()
    return success_response({"message": "Job deleted successfully"})