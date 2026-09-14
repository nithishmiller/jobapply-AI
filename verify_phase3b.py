import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def print_test(name, success):
    if success:
        print(f"[PASS] {name}")
    else:
        print(f"[FAIL] {name}")

def test_jobs_crud():
    # GET /jobs/ should return empty list initially
    resp = client.get("/jobs/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert isinstance(data["data"], list)
    initial_count = len(data["data"])
    print_test("GET /jobs/", True)

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
    print_test("POST /jobs/", True)

    # Get the job
    resp = client.get(f"/jobs/{job_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    job = data["data"]
    assert job["id"] == job_id
    assert job["title"] == "Test Engineer"
    print_test(f"GET /jobs/{job_id}", True)

    # Update the job
    update_data = {"salary_min": 66000, "salary_max": 76000}
    resp = client.put(f"/jobs/{job_id}", json=update_data)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    job = data["data"]
    assert job["salary_min"] == 66000
    assert job["salary_max"] == 76000
    print_test(f"PUT /jobs/{job_id}", True)

    # Delete the job
    resp = client.delete(f"/jobs/{job_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["data"]["message"] == "Job deleted successfully"
    # Verify deletion
    resp = client.get(f"/jobs/{job_id}")
    assert resp.status_code == 404
    print_test(f"DELETE /jobs/{job_id}", True)

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
    print_test("POST /jobs/ (for application)", True)

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
    if parsed_cv is None:
        print("No parsed CV found, skipping application creation test")
        # We can still test the validation errors for missing cv_id and job_id
        # Test POST /applications/ with missing cv_id
        resp = client.post("/applications/", json={"job_id": 1})
        assert resp.status_code == 400
        data = resp.json()
        assert data["status"] == "error"
        print_test("POST /applications/ missing cv_id", True)
        # Test POST /applications/ with missing job_id
        resp = client.post("/applications/", json={"cv_id": 1})
        assert resp.status_code == 400
        data = resp.json()
        assert data["status"] == "error"
        print_test("POST /applications/ missing job_id", True)
        # Test POST /applications/ with invalid cv_id (non-existent)
        resp = client.post("/applications/", json={"cv_id": 999999, "job_id": 1})
        assert resp.status_code == 400
        data = resp.json()
        assert data["status"] == "error"
        print_test("POST /applications/ invalid cv_id", True)
        # Test POST /applications/ with invalid job_id (non-existent)
        resp = client.post("/applications/", json={"cv_id": 1, "job_id": 999999})
        assert resp.status_code == 400
        data = resp.json()
        assert data["status"] == "error"
        print_test("POST /applications/ invalid job_id", True)
        # Clean up the job we created
        resp = client.delete(f"/jobs/{job_id}")
        assert resp.status_code == 200
        print_test("DELETE /jobs/ (cleanup)", True)
        return

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
    print_test("POST /applications/", True)

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
    print_test(f"GET /applications/{app_id}", True)

    # Update the application
    update_data = {"status": "interviewing", "notes": "Updated note"}
    resp = client.put(f"/applications/{app_id}", json=update_data)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    app = data["data"]
    assert app["status"] == "interviewing"
    assert app["notes"] == "Updated note"
    print_test(f"PUT /applications/{app_id}", True)

    # Delete the application
    resp = client.delete(f"/applications/{app_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["data"]["message"] == "Application deleted successfully"
    # Verify deletion
    resp = client.get(f"/applications/{app_id}")
    assert resp.status_code == 404
    print_test(f"DELETE /applications/{app_id}", True)

    # Clean up the job we created
    resp = client.delete(f"/jobs/{job_id}")
    assert resp.status_code == 200
    print_test("DELETE /jobs/ (cleanup)", True)

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
    print("All verification tests completed.")