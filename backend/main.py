from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from ai.parser import CVParser
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from database.connection import SessionLocal
from database.models import CV
from ai.sources import recompute_matches_for_new_jobs
from endpoints import cvs, jobs, applications, matches, sync
from utils.auth import install_auth
import os

app = FastAPI(
    title="JobApply AI",
    description="AI-powered job application assistant",
    version="1.0.0",
)

# Export as backend_app for testing
backend_app = app

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(cvs.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(matches.router)
app.include_router(sync.router)

# Serve static files for frontend
app.mount("/static", StaticFiles(directory="frontend"), name="static")

# Password gate — protects every route except /auth/*, /health, login CSS.
# Must be installed after routers so /auth/* routes exist.
install_auth(app)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx"}


@app.get('/')
def root():
    # Serve the main UI HTML page
    try:
        with open('frontend/index.html', 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, media_type='text/html')
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Failed to load UI: {e}"})


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/manifest.webmanifest")
def pwa_manifest():
    return FileResponse("frontend/manifest.webmanifest", media_type="application/manifest+json")


@app.get("/sw.js")
def service_worker():
    """Serve the SW from the root scope so it can control the whole app.
    (A /static/ scope would be unable to manage offline caching for '/'.)"""
    return FileResponse(
        "frontend/sw.js",
        media_type="application/javascript",
        headers={"Service-Worker-Allowed": "/"},
    )


@app.post("/upload-cv")
async def upload_cv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        return JSONResponse(
            status_code=400,
            content={"error": "Only PDF and DOCX CV files are supported."},
        )

    safe_name = Path(file.filename).name
    destination = UPLOAD_DIR / safe_name

    content = await file.read()
    destination.write_bytes(content)

    def safe_print(*args, **kwargs):
        try:
            print(*args, **kwargs)
        except UnicodeEncodeError:
            # Fallback: replace problematic characters
            safe_args = []
            for arg in args:
                if isinstance(arg, str):
                    safe_args.append(arg.encode('cp1252', errors='replace').decode('cp1252'))
                else:
                    safe_args.append(arg)
        print(*safe_args, **kwargs)

    # Parse the CV
    try:
        parser = CVParser()
        parsed_data = parser.parse_cv(str(destination))

        # Save to database with parsed data
        cv_record = CV(
            filename=safe_name,
            file_path=str(destination),
            status="parsed",
            raw_text=parsed_data.get("text"),
            contact_info=parsed_data.get("contact_info"),
            education=parsed_data.get("education"),
            experience=parsed_data.get("experience"),
            skills=parsed_data.get("skills")
        )
    except Exception as e:
        # If parsing fails, still save the file but mark as uploaded only
        safe_print(f"Parsing failed for {safe_name}: {e}")
        import traceback
        traceback.print_exc()
        cv_record = CV(
            filename=safe_name,
            file_path=str(destination),
            status="uploaded"
        )

    db.add(cv_record)
    db.commit()
    db.refresh(cv_record)

    # Score the new CV against all jobs immediately so matches are
    # usable without waiting for the next sync.
    matches_written = 0
    if cv_record.status == "parsed":
        try:
            matches_written = recompute_matches_for_new_jobs(db)
        except Exception as exc:
            safe_print(f"Match scoring failed for CV {cv_record.id}: {exc}")

    return {
        "status": "uploaded",
        "cv_id": cv_record.id,
        "filename": safe_name,
        "size_bytes": len(content),
        "message": "CV uploaded successfully.",
        "parsed": cv_record.status == "parsed",
        "matches_scored": matches_written,
        "raw_text_length": len(parsed_data.get("text", "")) if "parsed_data" in locals() else 0
    }