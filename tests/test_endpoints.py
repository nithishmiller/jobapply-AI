"""Endpoint smoke tests for JobApply AI.

The app is protected by a password gate (utils/auth.py). These tests sign in
through the real /auth/login flow using the same credential sources the app
itself reads (env var first, then .auth_password), so they run both locally
and in CI against a fresh database.
"""
import os
import tempfile
from pathlib import Path

import pytest
from docx import Document
from fastapi.testclient import TestClient

# Add project root to path
project_root = Path(__file__).parent.parent
import sys
sys.path.insert(0, str(project_root))

from backend.main import app  # noqa: E402
from ai.parser import CVParser  # noqa: E402

parser = CVParser()


@pytest.fixture(scope="module")
def client():
    """TestClient signed in through the real login flow."""
    with TestClient(app) as c:
        password = (
            os.environ.get("JOBAAPPLY_AUTH_PASSWORD", "").strip()
            or (project_root / ".auth_password").read_text(encoding="utf-8").strip()
        )
        resp = c.post(
            "/auth/login",
            data={"password": password, "display_name": "Test Runner"},
        )
        assert resp.status_code in (200, 303), "login during test setup failed"
        assert c.cookies.get("jobapply_session"), "session cookie was not set"
        yield c


def test_root_endpoint(client):
    """'/' now serves the premium UI (HTML), not a JSON status blob."""
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "JobApply" in response.text


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_unauthenticated_redirect():
    """The password gate must bounce strangers to the login page."""
    with TestClient(app) as c:
        c.cookies.clear()
        resp = c.get("/cvs/")
        # older TestClients auto-follow the redirect; either way the final
        # page must be the login screen, never CV data
        assert "Sign in" in resp.text or "/auth/login" in resp.url.path
        assert "parsed" not in resp.text[:500]


def test_upload_valid_pdf(client):
    pdf_path = "test_cv.pdf"
    pdf_content = """
John Doe
Email: john@example.com
Phone: 555-123-4567

Technical Stack:
Python, Django, MySQL, SQLite, HTML, CSS, JavaScript, REST APIs, Git, GitHub

Education:
Bachelor of Science in Computer Science
University of Example (2016-2020)
"""
    parser.create_test_pdf(pdf_path, pdf_content)
    try:
        with open(pdf_path, "rb") as f:
            response = client.post(
                "/upload-cv",
                files={"file": ("test_cv.pdf", f, "application/pdf")},
            )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "uploaded"
        assert data["filename"] == "test_cv.pdf"
        assert data["parsed"] is True
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)


def test_upload_valid_docx(client):
    docx_path = "test_cv.docx"
    doc = Document()
    doc.add_heading("John Doe", 0)
    doc.add_paragraph("Email: john@example.com")
    doc.add_paragraph("Phone: 555-123-4567")
    doc.add_heading("Technical Stack", level=1)
    doc.add_paragraph("Python, Django, MySQL, SQLite, HTML, CSS, JavaScript, REST APIs, Git, GitHub")
    doc.add_heading("Education", level=1)
    doc.add_paragraph("Bachelor of Science in Computer Science")
    doc.add_paragraph("University of Example (2016-2020)")
    doc.save(docx_path)
    try:
        with open(docx_path, "rb") as f:
            response = client.post(
                "/upload-cv",
                files={"file": (
                    "test_cv.docx", f,
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                )},
            )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "uploaded"
        assert data["filename"] == "test_cv.docx"
        assert data["parsed"] is True
    finally:
        if os.path.exists(docx_path):
            os.remove(docx_path)


def test_upload_invalid_file(client):
    fd, path = tempfile.mkstemp(suffix=".txt")
    try:
        with os.fdopen(fd, "wb") as tmp:
            tmp.write(b"This is not a valid CV file")
        with open(path, "rb") as f:
            response = client.post(
                "/upload-cv",
                files={"file": ("test.txt", f, "text/plain")},
            )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
    finally:
        if os.path.exists(path):
            os.unlink(path)


def test_get_cvs_parsed_entries(client):
    response = client.get("/cvs/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    parsed_entries = [cv for cv in data["data"] if cv.get("parsed")]
    # At least the uploads from the previous tests must be present and parsed.
    assert len(parsed_entries) >= 2
    for cv in parsed_entries:
        detail = client.get(f"/cvs/{cv['id']}")
        assert detail.status_code == 200
        d = detail.json()["data"]
        assert d["contact_info"] is not None
        assert d["skills"]


def test_delete_cv_removes_everything(client):
    """DELETE /cvs/{id} must exist and cascade matches + applications."""
    # create an isolated CV
    pdf_path = "test_del_cv.pdf"
    parser.create_test_pdf(pdf_path, "Jane Doe\nEmail: jane@example.com\nSkills: Python")
    try:
        with open(pdf_path, "rb") as f:
            up = client.post(
                "/upload-cv",
                files={"file": ("test_del_cv.pdf", f, "application/pdf")},
            ).json()
        cv_id = up["cv_id"]

        resp = client.delete(f"/cvs/{cv_id}")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "success"

        # gone from the list
        listing = client.get("/cvs/").json()["data"]
        assert all(cv["id"] != cv_id for cv in listing)

        # its matches were cascade-deleted too
        matches = client.get(f"/matches/cv/{cv_id}")
        assert matches.status_code in (200, 404)
        if matches.status_code == 200:
            assert matches.json()["data"] == []
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
