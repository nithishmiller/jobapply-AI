"""
Automated matching service for JobApply AI
Handles automatic generation and updating of match records
"""
from typing import List
from sqlalchemy.orm import Session
from database.connection import SessionLocal
from database.models import CV, Job, Match
from ai.matcher import get_match_for_cv_job

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def generate_matches_for_all_cvs_and_jobs(db: Session = None) -> int:
    """
    Generate or update matches for all CV-Job pairs
    Returns the number of matches processed
    """
    if db is None:
        db = SessionLocal()
        close_db = True
    else:
        close_db = False

    try:
        # Get all CVs and Jobs
        cvs = db.query(CV).all()
        jobs = db.query(Job).all()

        matches_processed = 0

        for cv in cvs:
            for job in jobs:
                try:
                    # Compute match
                    score, explanation, strengths, gaps = get_match_for_cv_job(cv.id, job.id, db)

                    # Check if match already exists
                    existing = db.query(Match).filter(
                        Match.cv_id == cv.id,
                        Match.job_id == job.id
                    ).first()

                    if existing:
                        # Update existing match
                        existing.score = int(score * 100) if score is not None else 0
                        existing.explanation = explanation
                        existing.strengths = strengths
                        existing.gaps = gaps
                    else:
                        # Create new match
                        db_match = Match(
                            cv_id=cv.id,
                            job_id=job.id,
                            score=int(score * 100) if score is not None else 0,
                            explanation=explanation,
                            strengths=strengths,
                            gaps=gaps
                        )
                        db.add(db_match)

                    matches_processed += 1

                except Exception as e:
                    # Log error but continue processing other pairs
                    print(f"Error matching CV {cv.id} with Job {job.id}: {e}")
                    continue

        db.commit()
        return matches_processed

    finally:
        if close_db:
            db.close()

def generate_matches_for_new_cv(cv_id: int, db: Session = None) -> int:
    """
    Generate matches for a newly added CV against all existing jobs
    Returns the number of matches processed
    """
    if db is None:
        db = SessionLocal()
        close_db = True
    else:
        close_db = False

    try:
        # Verify CV exists
        cv = db.query(CV).filter(CV.id == cv_id).first()
        if not cv:
            raise ValueError(f"CV with id {cv_id} not found")

        # Get all jobs
        jobs = db.query(Job).all()

        matches_processed = 0

        for job in jobs:
            try:
                # Compute match
                score, explanation, strengths, gaps = get_match_for_cv_job(cv.id, job.id, db)

                # Check if match already exists
                existing = db.query(Match).filter(
                    Match.cv_id == cv.id,
                    Match.job_id == job.id
                ).first()

                if existing:
                    # Update existing match
                    existing.score = int(score * 100) if score is not None else 0
                    existing.explanation = explanation
                    existing.strengths = strengths
                    existing.gaps = gaps
                else:
                    # Create new match
                    db_match = Match(
                        cv_id=cv.id,
                        job_id=job.id,
                        score=int(score * 100) if score is not None else 0,
                        explanation=explanation,
                        strengths=strengths,
                        gaps=gaps
                    )
                    db.add(db_match)

                matches_processed += 1

            except Exception as e:
                # Log error but continue processing other jobs
                print(f"Error matching CV {cv.id} with Job {job.id}: {e}")
                continue

        db.commit()
        return matches_processed

    finally:
        if close_db:
            db.close()

def generate_matches_for_new_job(job_id: int, db: Session = None) -> int:
    """
    Generate matches for a newly added job against all existing CVs
    Returns the number of matches processed
    """
    if db is None:
        db = SessionLocal()
        close_db = True
    else:
        close_db = False

    try:
        # Verify job exists
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise ValueError(f"Job with id {job_id} not found")

        # Get all CVs
        cvs = db.query(CV).all()

        matches_processed = 0

        for cv in cvs:
            try:
                # Compute match
                score, explanation, strengths, gaps = get_match_for_cv_job(cv.id, job.id, db)

                # Check if match already exists
                existing = db.query(Match).filter(
                    Match.cv_id == cv.id,
                    Match.job_id == job.id
                ).first()

                if existing:
                    # Update existing match
                    existing.score = int(score * 100) if score is not None else 0
                    existing.explanation = explanation
                    existing.strengths = strengths
                    existing.gaps = gaps
                else:
                    # Create new match
                    db_match = Match(
                        cv_id=cv.id,
                        job_id=job.id,
                        score=int(score * 100) if score is not None else 0,
                        explanation=explanation,
                        strengths=strengths,
                        gaps=gaps
                    )
                    db.add(db_match)

                matches_processed += 1

            except Exception as e:
                # Log error but continue processing other CVs
                print(f"Error matching CV {cv.id} with Job {job.id}: {e}")
                continue

        db.commit()
        return matches_processed

    finally:
        if close_db:
            db.close()

def update_match_for_cv_job(cv_id: int, job_id: int, db: Session = None) -> bool:
    """
    Update a specific CV-Job match record
    Returns True if match was updated/created, False otherwise
    """
    if db is None:
        db = SessionLocal()
        close_db = True
    else:
        close_db = False

    try:
        # Verify both exist
        cv = db.query(CV).filter(CV.id == cv_id).first()
        job = db.query(Job).filter(Job.id == job_id).first()

        if not cv:
            raise ValueError(f"CV with id {cv_id} not found")
        if not job:
            raise ValueError(f"Job with id {job_id} not found")

        # Compute match
        score, explanation, strengths, gaps = get_match_for_cv_job(cv.id, job_id, db)

        # Check if match already exists
        existing = db.query(Match).filter(
            Match.cv_id == cv.id,
            Match.job_id == job_id
        ).first()

        if existing:
            # Update existing match
            existing.score = int(score * 100) if score is not None else 0
            existing.explanation = explanation
            existing.strengths = strengths
            existing.gaps = gaps
        else:
            # Create new match
            db_match = Match(
                cv_id=cv_id,
                job_id=job_id,
                score=int(score * 100) if score is not None else 0,
                explanation=explanation,
                strengths=strengths,
                gaps=gaps
            )
            db.add(db_match)

        db.commit()
        return True

    except Exception as e:
        print(f"Error updating match for CV {cv_id} and Job {job_id}: {e}")
        return False
    finally:
        if close_db:
            db.close()