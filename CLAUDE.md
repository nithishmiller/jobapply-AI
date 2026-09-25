# JobApply AI — Permanent Engineering Rules

## Product
JobApply AI is a Germany-first AI career and job application assistant.

Primary flow:
CV → AI Intelligence → Germany → Cities → Jobs → AI Matching → Application Generation → Applications → Tracking → CTA

## Visual Direction
- Dark cinematic
- Deep black/navy foundation
- Cyan/blue accents
- Glowing interfaces
- Large visual compositions
- Layered depth and blur
- Sophisticated typography
- Premium editorial/product-showcase feel
- Motion, image/video reveals and scroll-driven scenes where justified
- 3D/WebGL/shaders only when they materially improve the experience
- Fully responsive

## Frontend
- React
- TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui
- Base UI
- Motion
- Lenis
- GSAP
- Three.js / React Three Fiber / Drei when justified

## Backend
- Python
- FastAPI
- Uvicorn
- PostgreSQL
- REST APIs
- External AI APIs

## Engineering Rules
- Keep the application runnable.
- Do not randomly redesign working sections.
- Do not change architecture without approval.
- Do not install dependencies without approval.
- Do not create duplicate components.
- Reuse existing components and utilities when appropriate.
- Keep TypeScript strict and clean.
- Prefer maintainable production code over unnecessary complexity.
- Preserve responsive behavior.
- Consider accessibility and performance in every feature.
- Do not introduce unnecessary local infrastructure.
- Do not install local LLMs or model weights.
- Use external AI APIs for inference.

## Project Boundary
The active project is ONLY:

F:\AI Task\AI JOB

Never touch or modify:
G:\sample\proj

## Quality Pipeline
CODE → TYPECHECK → LINT → BUILD → PLAYWRIGHT → LIGHTHOUSE → VISUAL QA → RESPONSIVE QA → PERFORMANCE → SECURITY → SHIP

## Security
- Never expose API keys or secrets.
- Never commit .env files or credentials.
- Validate external input.
- Apply security practices appropriate for production APIs.

## Git
- Make focused commits.
- Do not rewrite history unless explicitly requested.
- Do not force-push unless explicitly approved.
- Keep the working tree understandable.

## Important
Before making substantial architectural, visual, dependency, or structural changes, explain the proposed change and wait for approval.
