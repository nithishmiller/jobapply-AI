import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_jobs_crud():
    # GET /jobs/ should return empty list initially
    resp = client.get("/jobs/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert isinstance(data["data"], list)
    initial_count = len(data["data"])
    print(f"Initial jobs count: {initial_count}")

    # Create a job
    job_data = {
        "title": "Test Engineer",
        "company": "Test Co",
        "location": "Test City",
        "country": "Testland",
        "state": "TS",
        "remote": False,
        "employment_type": "Full-time",
        "salary": "70000",
        "salary_min": 65000,
        "salary_max": 75000,
        "currency": "USD",
        "description": "A test job.",
        "requirements": "Python, SQL",
        "preferred_requirements": "AWS",
        "skills": "Python, SQL, AWS",
        "url": "http://example.com/job1",
        "source": "manual",
        "posted_date": "2026-09-10",
        "language_requirements": "English",
        "experience_level": "Mid",
        "visa_sponsorship": False,
        "relocation_support": False
    }
    resp = client.post("/jobs/", json=job_data)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "success"
    job = data["data"]
    job_id = job["id"]
    assert job["title"] == "Test Engineer"
    print(f"Created job ID: {job_id}")

    # Get the job
    resp = client.get(f"/jobs/{job_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    job = data["data"]
    assert job["id"] == job_id
    assert job["title"] == "Test Engineer"
    print(f"Retrieved job ID: {job_id}")

    # Update the job
    update_data = {"salary_min": 66000, "salary_max": 76000}
    resp = client.put(f"/jobs/{job_id}", json=update_data)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    job = data["data"]
    assert job["salary_min"] == 66000
    assert job["salary_max"] == 76000
    print(f"Updated job ID: {job_id}")

    # Delete the job
    resp = client.delete(f"/jobs/{job_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["data"]["message"] == "Job deleted successfully"
    # Verify deletion
    resp = client.get(f"/jobs/{job_id}")
    assert resp.status_code == 404
    print(f"Deleted and verified job ID: {job_id}")

def test_applications_crud():
    # First, ensure we have at least one job and one CV
    # Create a job
    job_data = {
        "title": "App Test Job",
        "company": "App Co",
        "location": "App City",
        "country": "AppLand",
        "state": "AS",
        "remote": True,
        "employment_type": "Part-time",
        "salary": "50000",
        "salary_min": 45000,
        "salary_max": 55000,
        "currency": "USD",
        "description": "An application test job.",
        "requirements": "JavaScript",
        "preferred_requirements": "React",
        "skills": "JavaScript, React, HTML, CSS",
        "url": "http://example.com/jobapp",
        "source": "manual",
        "posted_date": "2026-09-10",
        "language_requirements": "English",
        "experience_level": "Entry",
        "visa_sponsorship": True,
        "relocation_support": False
    }
    resp = client.post("/jobs/", json=job_data)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "success"
    job_id = data["data"]["id"]
    print(f"Created job for application: {job_id}")

    # Get a parsed CV
    resp = client.get("/cvs/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    cvs = data["data"]
    parsed_cv = None
    for cv in cvs:
        if cv.get("parsed"):
            parsed_cv = cv
            break
    assert parsed_cv is not None, "No parsed CV found"
    cv_id = parsed_cv["id"]
    print(f"Using parsed CV ID: {cv_id} (filename: {parsed_cv['filename']})")

    # Create application
    app_data = {
        "cv_id": cv_id,
        "job_id": job_id,
        "status": "applied",
        "notes": "Test application for verification"
    }
    resp = client.post("/applications/", json=app_data)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "success"
    app = data["data"]
    app_id = app["id"]
    assert app["cv_id"] == cv_id
    assert app["job_id"] == job_id
    assert app["status"] == "applied"
    print(f"Created application ID: {app_id}")

    # Get the application
    resp = client.get(f"/applications/{app_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    app = data["data"]
    assert app["id"] == app_id
    assert app["cv_id"] == cv_id
    assert app["job_id"] == job_id
    assert app["status"] == "applied"
    print(f"Retrieved application ID: {app_id}")

    # Update the application
    update_data = {"status": "interviewing", "notes": "Updated note"}
    resp = client.put(f"/applications/{app_id}", json=update_data)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    app = data["data"]
    assert app["status"] == "interviewing"
    assert app["notes"] == "Updated note"
    print(f"Updated application ID: {app_id}")

    # Delete the application
    resp = client.delete(f"/applications/{app_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["data"]["message"] == "Application deleted successfully"
    # Verify deletion
    resp = client.get(f"/applications/{app_id}")
    assert resp.status_code == 404
    print(f"Deleted and verified application ID: {app_id}")

    # Clean up the job we created
    resp = client.delete(f"/jobs/{job_id}")
    assert resp.status_code == 200

if __name__ == "__main__":
    try:
        test_jobs_crud()
    except Exception as e:
        print(f"test_jobs_crud: FAIL - {e}")
        import traceback
        traceback.print_exc()
    try:
        test_applications_crud()
    except Exception as e:
        print(f"test_applications_crud: FAIL - {e}")
        import traceback
        traceback.print_exc()
    print("All tests completed.")