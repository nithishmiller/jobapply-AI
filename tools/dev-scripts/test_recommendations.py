import sys
import os
from pathlib import Path
from datetime import datetime

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from database.connection import SessionLocal
from database.models import CV, Job
from ai.matching_service import generate_matches_for_all_cvs_and_jobs
from endpoints.matches import get_job_recommendations_for_cv, get_cv_recommendations_for_job
from utils.response import success_response

def test_recommendations():
    db = SessionLocal()
    try:
        print("Testing recommendation endpoints...")

        # Create a test CV
        test_cv = CV(
            filename="test_cv.pdf",
            file_path="uploads/test_cv.pdf",
            status="parsed",
            raw_text="Test CV content with Python and JavaScript skills",
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

        # Generate matches for all CVs and jobs
        count = generate_matches_for_all_cvs_and_jobs(db)
        print(f"Generated/updated {count} matches for all CVs and jobs")

        # Test job recommendations for CV
        print("\n--- Testing job recommendations for CV ---")
        response = get_job_recommendations_for_cv(test_cv.id, db, limit=5, min_score=0)
        recommendations = response.get('data', [])
        print(f"Got {len(recommendations)} recommendations")
        if recommendations:
            for i, rec in enumerate(recommendations[:3]):  # Show first 3
                print(f"  {i+1}. Job: {rec['job']['title']} at {rec['job']['company']}")
                print(f"     Score: {rec['match']['score']}%")
                print(f"     Strengths: {rec['match']['strengths']}")
                print(f"     Gaps: {rec['match']['gaps']}")

        # Test CV recommendations for job
        print("\n--- Testing CV recommendations for job ---")
        cv_response = get_cv_recommendations_for_job(test_job.id, db, limit=5, min_score=0)
        cv_recommendations = cv_response.get('data', [])
        print(f"Got {len(cv_recommendations)} CV recommendations")
        if cv_recommendations:
            for i, rec in enumerate(cv_recommendations[:3]):  # Show first 3
                print(f"  {i+1}. CV: {rec['cv']['filename']}")
                print(f"     Score: {rec['match']['score']}%")
                print(f"     Strengths: {rec['match']['strengths']}")
                print(f"     Gaps: {rec['match']['gaps']}")

        print("\nRecommendation test completed successfully!")

    except Exception as e:
        print(f"Error in recommendation test: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_recommendations()