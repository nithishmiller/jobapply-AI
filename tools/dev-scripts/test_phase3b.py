import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_jobs_endpoint():
    response = client.get("/jobs/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert isinstance(data["data"], list)
    # Initially empty
    assert len(data["data"]) == 0
    print("GET /jobs/ - PASS")

def test_create_job():
    job_data = {
        "title": "Software Engineer",
        "company": "Test Corp",
        "location": "New York",
        "country": "USA",
        "state": "NY",
        "remote": False,
        "employment_type": "Full-time",
        "salary": "100000",
        "salary_min": 90000,
        "salary_max": 110000,
        "currency": "USD",
        "description": "Develop software",
        "requirements": "Python, Django",
        "preferred_requirements": "AWS",
        "skills": "Python, Django, AWS",
        "url": "http://example.com/job",
        "source": "manual",
        "posted_date": "2026-09-10",
        "language_requirements": "English",
        "experience_level": "Mid",
        "visa_sponsorship": False,
        "relocation_support": False
    }
    response = client.post("/jobs/", json=job_data)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    job = data["data"]
    assert job["title"] == "Software Engineer"
    assert job["company"] == "Test Corp"
    assert job["id"] == 1
    print("POST /jobs/ - PASS")

def test_get_job():
    response = client.get("/jobs/1")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    job = data["data"]
    assert job["title"] == "Software Engineer"
    assert job["id"] == 1
    print("GET /jobs/1 - PASS")

def test_update_job():
    update_data = {
        "title": "Senior Software Engineer",
        "salary_min": 95000,
        "salary_max": 120000
    }
    response = client.put("/jobs/1", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    job = data["data"]
    assert job["title"] == "Senior Software Engineer"
    assert job["salary_min"] == 95000
    assert job["salary_max"] == 120000
    print("PUT /jobs/1 - PASS")

def test_delete_job():
    response = client.delete("/jobs/1")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["message"] == "Job deleted successfully"
    # Verify it's gone
    response2 = client.get("/jobs/1")
    assert response2.status_code == 404
    print("DELETE /jobs/1 - PASS")

def test_applications_endpoint():
    response = client.get("/applications/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert isinstance(data["data"], list)
    assert len(data["data"]) == 0
    print("GET /applications/ - PASS")

def test_create_application():
    # Need a CV and a Job first. We'll create a CV via upload (but we can't upload file easily).
    # Instead, we can directly insert a CV record using the ORM? But we are restricted to not modify DB directly.
    # However, we can use the existing CV upload endpoint to create a CV.
    # We'll use the existing test PDF from earlier.
    # We'll use the existing test_cv.pdf file that we have from earlier tests.
    # We'll upload it via the /upload-cv endpoint.
    # Then we'll create an application linking that CV to a job we create.
    # Since we already have a job from previous test? We deleted it, so we need to create a job again.
    # Let's do a quick sequence: create job, upload CV, create application.
    # Create job
    job_data = {
        "title": "Test Job",
        "company": "Test Co",
        "location": "Loc",
        "country": "USA",
        "state": "ST",
        "remote": False,
        "employment_type": "Full-time",
        "salary": "50000",
        "salary_min": 40000,
        "salary_max": 60000,
        "currency": "USD",
        "description": "Desc",
        "requirements": "Python",
        "preferred_requirements": "",
        "skills": "Python",
        "url": "http://example.com/job2",
        "source": "manual",
        "posted_date": "2026-09-10",
        "language_requirements": "English",
        "experience_level": "Entry",
        "visa_sponsorship": False,
        "relocation_support": False
    }
    resp_job = client.post("/jobs/", json=job_data)
    assert resp_job.status_code == 201
    job_id = resp_job.json()["data"]["id"]
    # Upload CV
    with open("uploads/test_cv.pdf", "rb") as f:
        resp_cv = client.post("/upload-cv", files={"file": ("test_cv.pdf", f, "application/pdf")})
    # The upload-cv endpoint returns parsed: true/false but we just need the CV to exist.
    # We'll get the list of CVs to get the latest CV id.
    resp_cvs = client.get("/cvs/")
    assert resp_cvs.status_code == 200
    cvs_data = resp_cvs.json()["data"]
    # Find the CV with filename test_cv.pdf (should be the last one)
    cv_id = None
    for cv in cvs_data:
        if cv["filename"] == "test_cv.pdf":
            cv_id = cv["id"]
            break
    assert cv_id is not None
    # Create application
    app_data = {
        "cv_id": cv_id,
        "job_id": job_id,
        "status": "applied",
        "notes": "Test application"
    }
    resp_app = client.post("/applications/", json=app_data)
    assert resp_app.status_code == 201
    app_data_resp = resp_app.json()["data"]
    assert app_data_resp["cv_id"] == cv_id
    assert app_data_resp["job_id"] == job_id
    assert app_data_resp["status"] == "applied"
    print("POST /applications/ - PASS")

    # Clean up? Not necessary.

def test_get_application():
    # We'll just get the first application if any.
    resp = client.get("/applications/")
    assert resp.status_code == 200
    apps = resp.json()["data"]
    if len(apps) > 0:
        app_id = apps[0]["id"]
        resp2 = client.get(f"/applications/{app_id}")
        assert resp2.status_code == 200
        data = resp2.json()["data"]
        assert data["status"] == "success"
        app = data["data"]
        assert app["id"] == app_id
        print("GET /applications/{id} - PASS")
    else:
        print("No applications to test GET")

if __name__ == "__main__":
    try:
        test_jobs_endpoint()
    except Exception as e:
        print(f"test_jobs_endpoint: FAIL - {e}")
    try:
        test_create_job()
    except Exception as e:
        print(f"test_create_job: FAIL - {e}")
    try:
        test_get_job()
    except Exception as e:
        print(f"test_get_job: FAIL - {e}")
    try:
        test_update_job():
    except Exception as e:
        print(f"test_update_job: FAIL - {e}")
    try:
        test_delete_job()
    except Exception as e:
        print(f"test_delete_job: FAIL - {e}")
    try:
        test_applications_endpoint()
    except Exception as e:
        print(f"test_applications_endpoint: FAIL - {e}")
    try:
        test_create_application()
    except Exception as e:
        print(f"test_create_application: FAIL - {e}")
    try:
        test_get_application()
    except Exception as e:
        print(f"test_get_application: FAIL - {e}")
    print("All tests completed.")