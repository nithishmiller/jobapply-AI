import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from ai.matching_service import generate_matches_for_all_cvs_and_jobs, generate_matches_for_new_cv, generate_matches_for_new_job, update_match_for_cv_job
from database.connection import SessionLocal
from database.models import CV, Job, Match
from ai.matcher import get_match_for_cv_job
from datetime import datetime

def test_matching_service():
    db = SessionLocal()
    try:
        print("Testing matching service...")

        # Create a test CV
        test_cv = CV(
            filename="test_cv.pdf",
            file_path="uploads/test_cv.pdf",
            status="parsed",
            raw_text="Test CV content",
            contact_info={"name": "Test User", "email": "test@example.com"},
            education=[{"degree": "Bachelor", "institution": "Test University", "year": "2020"}],
            experience=[{"position": "Software Engineer", "company": "Test Corp", "date": "2020-2022", "description": "Developed web apps"}],
            skills=["Python", "JavaScript", "SQL"],
            upload_date=datetime.utcnow()
        )
        db.add(test_cv)
        db.commit()
        db.refresh(test_cv)
        print(f"Created test CV with ID: {test_cv.id}")

        # Create a test job
        test_job = Job(
            title="Software Engineer",
            company="Test Company",
            location="Berlin",
            country="Germany",
            state="Berlin",
            remote=False,
            employment_type="Full-time",
            salary="60000 EUR",
            salary_min=55000,
            salary_max=65000,
            currency="EUR",
            description="We are looking for a Software Engineer",
            requirements="Python, JavaScript, SQL, Git",
            preferred_requirements="Docker, AWS",
            skills="Python, JavaScript, SQL, Git, Docker, AWS",
            url="http://example.com/job",
            source="manual",
            posted_date=datetime(2026, 9, 10),
            language_requirements="German B2, English B1",
            experience_level="Mid",
            visa_sponsorship=False,
            relocation_support=True,
            created_at=datetime.utcnow()
        )
        db.add(test_job)
        db.commit()
        db.refresh(test_job)
        print(f"Created test job with ID: {test_job.id}")

        # Test match computation
        score, explanation, strengths, gaps = get_match_for_cv_job(test_cv.id, test_job.id, db)
        print(f"Match score: {score*100:.0f}%")
        print(f"Explanation: {explanation}")
        print(f"Strengths: {strengths}")
        print(f"Gaps: {gaps}")

        # Test updating match for specific CV-Job pair
        result = update_match_for_cv_job(test_cv.id, test_job.id, db)
        print(f"Update match result: {result}")

        # Verify match was created
        matches = db.query(Match).filter(Match.cv_id == test_cv.id, Match.job_id == test_job.id).all()
        print(f"Number of matches found: {len(matches)}")
        if matches:
            match = matches[0]
            print(f"Match score: {match.score}")
            print(f"Match explanation: {match.explanation}")
            print(f"Match strengths: {match.strengths}")
            print(f"Match gaps: {match.gaps}")

        # Test generating matches for all CVs and jobs
        count = generate_matches_for_all_cvs_and_jobs(db)
        print(f"Generated/updated {count} matches for all CVs and jobs")

        # Test generating matches for a new CV
        new_cv = CV(
            filename="test_cv2.pdf",
            file_path="uploads/test_cv2.pdf",
            status="parsed",
            raw_text="Another test CV",
            contact_info={"name": "Another User", "email": "another@example.com"},
            education=[{"degree": "Master", "institution": "Another Uni", "year": "2021"}],
            experience=[{"position": "Data Scientist", "company": "Data Corp", "date": "2021-2023", "description": "Analyzed data"}],
            skills=["Python", "R", "Tableau", "SQL"],
            upload_date=datetime.utcnow()
        )
        db.add(new_cv)
        db.commit()
        db.refresh(new_cv)
        print(f"Created new CV with ID: {new_cv.id}")

        count = generate_matches_for_new_cv(new_cv.id, db)
        print(f"Generated/updated {count} matches for new CV")

        # Test generating matches for a new job
        new_job = Job(
            title="Data Scientist",
            company="Data Company",
            location="Hamburg",
            country="Germany",
            state="Hamburg",
            remote=True,
            employment_type="Full-time",
            salary="55000 EUR",
            salary_min=50000,
            salary_max=60000,
            currency="EUR",
            description="We are looking for a Data Scientist",
            requirements="Python, R, SQL, Statistics",
            preferred_requirements="Machine Learning, Tableau",
            skills="Python, R, SQL, Statistics, Tableau, Machine Learning",
            url="http://example.com/job2",
            source="manual",
            posted_date=datetime(2026, 9, 10),
            language_requirements="German C1, English B2",
            experience_level="Senior",
            visa_sponsorship=True,
            relocation_support=True,
            created_at=datetime.utcnow()
        )
        db.add(new_job)
        db.commit()
        db.refresh(new_job)
        print(f"Created new job with ID: {new_job.id}")

        count = generate_matches_for_new_job(new_job.id, db)
        print(f"Generated/updated {count} matches for new job")

        # Final count
        total_matches = db.query(Match).count()
        print(f"Total matches in database: {total_matches}")

        print("Matching service test completed successfully!")

    except Exception as e:
        print(f"Error in matching service test: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_matching_service()