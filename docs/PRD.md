# JobApply AI — Product Requirements Document

## 1. Product Overview

JobApply AI is a Germany-first AI career and job application assistant designed to help candidates move from CV preparation to job discovery, matching, application generation and application tracking.

## 2. Primary User Journey

CV
? AI Intelligence
? Germany
? Cities
? Jobs
? AI Matching
? Application Generation
? Applications
? Tracking
? CTA

## 3. Germany-First Requirements

- Germany is the default target country.
- Currency: EUR.
- German language proficiency must be represented using CEFR levels.
- Job listings should surface visa sponsorship information when available.
- CV generation should support Germany-oriented and Europass-compatible output.
- CV content should remain ATS-friendly.
- German employment terminology should be handled accurately.

## 4. Core Features

### CV Intelligence
- Upload CV.
- Extract structured candidate information.
- Identify skills, experience, education and projects.
- Detect missing or weak information.
- Generate actionable CV insights.

### Job Discovery
- Search and display relevant jobs.
- Filter by location, role, salary and other relevant attributes.
- Germany-first location and employment context.
- Show sponsorship information when available.

### AI Job Matching
- Compare candidate profile against job requirements.
- Explain match factors.
- Identify missing skills or requirements.
- Provide transparent matching rationale.

### Application Generation
- Generate tailored application materials.
- Adapt content to the target job.
- Preserve factual candidate information.
- Avoid fabricated experience or qualifications.

### Application Tracking
- Track applications.
- Track application status.
- Store relevant job and company information.
- Provide useful progress visibility.

## 5. Frontend

- React
- TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui with Base UI
- Motion
- GSAP
- Lenis
- Three.js / React Three Fiber where justified

## 6. Backend

- Python
- FastAPI
- Uvicorn
- PostgreSQL for production
- SQLite acceptable for local development
- REST API
- External AI APIs

## 7. Design Requirements

The product should feel:

- Premium
- Cinematic
- Technical
- Trustworthy
- Modern
- High-end

Visual direction:

- Deep black/navy foundation
- Cyan/blue accents
- Controlled glow
- Layered depth
- Sophisticated typography
- Large visual compositions
- Meaningful motion
- Responsive layouts
- Accessible interactions

## 8. Non-Goals

- No unnecessary local AI models.
- No unnecessary Docker infrastructure.
- No unnecessary dependencies.
- No duplicate component systems.
- No fabricated candidate information.
- No architecture changes without approval.

## 9. Quality Requirements

Every meaningful feature should be verified through:

CODE ? TYPECHECK ? LINT ? BUILD ? PLAYWRIGHT ? LIGHTHOUSE ? VISUAL QA ? RESPONSIVE QA ? PERFORMANCE ? SECURITY ? SHIP
