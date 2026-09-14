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

def test_applications_validation():
    # GET /applications/ should return empty list initially
    resp = client.get("/applications/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert isinstance(data["data"], list)
    print_test("GET /applications/", True)

    # POST /applications/ missing cv_id
    resp = client.post("/applications/", json={"job_id": 1})
    assert resp.status_code == 400
    data = resp.json()
    assert data["status"] == "error"
    print_test("POST /applications/ missing cv_id", True)

    # POST /applications/ missing job_id
    resp = client.post("/applications/", json={"cv_id": 1})
    assert resp.status_code == 400
    data = resp.json()
    assert data["status"] == "error"
    print_test("POST /applications/ missing job_id", True)

    # POST /applications/ with invalid cv_id (non-existent)
    resp = client.post("/applications/", json={"cv_id": 999999, "job_id": 1})
    assert resp.status_code == 400
    data = resp.json()
    assert data["status"] == "error"
    print_test("POST /applications/ invalid cv_id", True)

    # POST /applications/ with invalid job_id (non-existent)
    resp = client.post("/applications/", json={"cv_id": 1, "job_id": 999999})
    assert resp.status_code == 400
    data = resp.json()
    assert data["status"] == "error"
    print_test("POST /applications/ invalid job_id", True)

if __name__ == "__main__":
    try:
        test_jobs_crud()
    except Exception as e:
        print(f"test_jobs_crud: FAIL - {e}")
        import traceback
        traceback.print_exc()
    try:
        test_applications_validation()
    except Exception as e:
        print(f"test_applications_validation: FAIL - {e}")
        import traceback
        traceback.print_exc()
    print("All verification tests completed.")