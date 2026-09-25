# JobApply AI — Architecture Decisions

## ADR-001 — Germany-First Product

Status: Accepted

JobApply AI is designed primarily around the German job market.

Reasons:

- Germany is the initial target market.
- Job discovery should prioritize German locations.
- CV workflows should support Germany-oriented requirements.
- German language proficiency and visa sponsorship are important job attributes.

## ADR-002 — React + TypeScript + Vite

Status: Accepted

The frontend uses:

- React
- TypeScript
- Vite

Reasons:

- Strong component architecture.
- Type safety.
- Fast development workflow.
- Suitable ecosystem for advanced visual experiences.

## ADR-003 — Tailwind CSS v4

Status: Accepted

Tailwind CSS v4 is the primary styling system.

Reasons:

- Rapid iteration.
- Consistent design tokens.
- Good integration with the existing Vite stack.
- Suitable for the cinematic visual system.

## ADR-004 — shadcn/ui + Base UI

Status: Accepted

The project uses shadcn/ui with Base UI.

Reasons:

- Accessible component foundation.
- Components remain customizable.
- Avoids depending on a rigid visual design system.
- Fits the project's premium custom visual direction.

## ADR-005 — Motion + GSAP + Lenis

Status: Accepted

Each motion tool has a defined role:

- Motion ? UI interactions and component transitions.
- GSAP ? complex cinematic timelines.
- Lenis ? smooth scrolling.

Do not use multiple animation systems for the same interaction without a reason.

## ADR-006 — Three.js / React Three Fiber

Status: Accepted

3D/WebGL is available but should be used selectively.

Potential use cases:

- AI Intelligence Core.
- Germany topology.
- City networks.
- Job signal visualization.
- Interactive product storytelling.

3D must justify its performance cost.

## ADR-007 — FastAPI Backend

Status: Accepted

FastAPI is the primary backend framework.

Reasons:

- Python ecosystem.
- Strong API development experience.
- Good fit for AI integrations.
- Clear REST API architecture.

Django should only be introduced if a concrete requirement justifies it.

## ADR-008 — PostgreSQL

Status: Accepted

PostgreSQL is the production database.

SQLite may be used for local development when appropriate.

MySQL is not part of the default production architecture.

## ADR-009 — External AI Providers

Status: Accepted

AI inference uses external providers rather than local model hosting.

Reasons:

- Avoid unnecessary local infrastructure.
- Avoid large model downloads.
- Keep the application lightweight.
- Allow provider flexibility through an integration layer.

## ADR-010 — No Unnecessary Infrastructure

Status: Accepted

The project should avoid infrastructure that does not provide clear product value.

Examples:

- Unnecessary Docker usage.
- Unnecessary local AI models.
- Duplicate backend services.
- Duplicate component libraries.
- Unnecessary MCP integrations.

## ADR-011 — Documentation as Source of Truth

Status: Accepted

The following documents define project intent:

- CLAUDE.md
- PRD.md
- ARCHITECTURE.md
- DESIGN-SYSTEM.md
- UX-FLOWS.md
- PERFORMANCE.md
- SECURITY.md
- DECISIONS.md

Agents should inspect these documents before making major changes.

## ADR-012 — Preserve Working Architecture

Status: Accepted

Working architecture should not be replaced or redesigned without explicit approval.

Changes should be:

- Scoped.
- Reversible where practical.
- Tested.
- Documented when architectural.

## ADR-013 — Active Project Boundary

Status: Accepted

The active project is:

F:\AI Task\AI JOB

Unrelated projects must not be modified.

In particular:

G:\sample\proj

must never be touched.
