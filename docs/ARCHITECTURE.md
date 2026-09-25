# JobApply AI — Architecture

## Architecture Principles

- Keep frontend and backend independently maintainable.
- Use clear API boundaries.
- Prefer simple, testable modules.
- Avoid unnecessary infrastructure.
- Keep external AI providers behind a controlled integration layer.

## Repository Structure

```text
JobApply AI/
+-- CLAUDE.md
+-- README.md
+-- docs/
¦   +-- PRD.md
¦   +-- ARCHITECTURE.md
¦   +-- DESIGN-SYSTEM.md
¦   +-- UX-FLOWS.md
¦   +-- PERFORMANCE.md
¦   +-- SECURITY.md
¦   +-- DECISIONS.md
+-- frontend/
+-- backend/
+-- tests/
Frontend

Technology:

* React
* TypeScript
* Vite
* Tailwind CSS v4
* shadcn/ui + Base UI

Supporting systems:

* Motion for interface animation.
* GSAP for complex cinematic timelines.
* Lenis for smooth scrolling.
* Three.js / React Three Fiber / Drei for justified 3D experiences.
* Custom GLSL shaders only where they provide meaningful visual value.

Backend

Primary stack:

* Python
* FastAPI
* Uvicorn
* REST API

Django may be introduced only when a concrete requirement justifies it.

Database

Production:

* PostgreSQL

Local development:

* SQLite may be used when appropriate.

MySQL is optional and should only be introduced when required.

AI Layer

* External AI APIs only.
* Provider integrations should be isolated from business logic.
* Never hard-code API keys.
* Never expose API keys to the frontend.
* AI-generated content must not fabricate candidate qualifications or experience.

API Boundary

Frontend communicates with backend through REST APIs.

The frontend should not directly access the production database or private AI provider credentials.

Component Architecture

* Build reusable components.
* Avoid duplicate implementations.
* Keep UI primitives separate from product-specific sections.
* Prefer composition over deeply coupled components.

Performance

* Lazy-load expensive features.
* Avoid unnecessary 3D/WebGL.
* Keep animation performant.
* Minimize bundle growth.
* Optimize media assets.
* Respect reduced-motion preferences.

Security

* Validate uploaded files.
* Validate API inputs.
* Keep secrets server-side.
* Apply appropriate authentication and authorization.
* Avoid unsafe rendering of untrusted content.
* Perform security testing before production release.

Deployment

Frontend:

* Cloud frontend deployment.

Backend:

* Cloud backend deployment.

Database:

* Managed PostgreSQL.

AI:

* External AI APIs.

Avoid unnecessary local infrastructure.
