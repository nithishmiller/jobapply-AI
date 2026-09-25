# JobApply AI — Engineering Rules

## Product
- Germany-first AI career and job application assistant.
- Primary flow: CV ? AI Intelligence ? Germany ? Cities ? Jobs ? AI Matching ? Application Generation ? Applications ? Tracking ? CTA.
- Default country: Germany.
- Currency: EUR.
- Support German language proficiency and visa sponsorship indicators.

## Visual Direction
- Dark cinematic.
- Deep black/navy foundation.
- Cyan/blue accents and controlled glow.
- Premium, high-end product-showcase aesthetic.
- Large visual compositions, layered depth, blur and sophisticated typography.
- Motion, image/video reveals, scroll-driven scenes and interactive galleries.
- 3D/WebGL/shaders only where they materially improve the experience.
- Fully responsive and mobile-first where appropriate.

## Frontend
- React
- TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui with Base UI
- Motion
- GSAP
- Lenis
- Three.js
- React Three Fiber
- Drei
- GLSL/custom shaders where justified

## Backend
- Python
- FastAPI
- Uvicorn
- Django only when specifically required
- PostgreSQL for production
- SQLite acceptable for local development
- External AI APIs only

## Engineering Rules
- Do not randomly redesign working sections.
- Do not change architecture without approval.
- Do not install dependencies without approval.
- Do not create duplicate components.
- Prefer reusable components and clear separation of concerns.
- Keep the application runnable after every meaningful change.
- Preserve existing functionality while improving it.
- Optimize for performance, accessibility, responsive behavior and security.
- Never touch unrelated projects or directories.
- Active project: F:\AI Task\AI JOB
- Never touch G:\sample\proj.

## Quality Gate
CODE ? TYPECHECK ? LINT ? BUILD ? PLAYWRIGHT ? LIGHTHOUSE ? VISUAL QA ? RESPONSIVE QA ? PERFORMANCE ? SECURITY ? SHIP

## AI Coding
- Claude Code is the primary coding agent.
- Codex CLI is the secondary coding/review agent.
- FreeLLMAPI provides the local API gateway.
- Use project documentation as the source of truth.
- Do not expose or request API keys in source files or chat.

## Design References
Use reference sites and visual research as inspiration, not as reasons to introduce unnecessary dependencies:
- Google Stitch
- Refero
- React Bits
- Aceternity UI
- 21st.dev
- Watermelon UI
- Uiverse
- Layers
- Aura.build

## Important
Before making a large architectural or visual change:
1. Inspect the existing implementation.
2. Explain the intended change.
3. Keep the change scoped.
4. Verify build and lint afterward.
