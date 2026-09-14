---
title: JobApply AI
emoji: 💼
colorFrom: yellow
colorTo: purple
sdk: docker
app_port: 7860
pinned: true
---

# JobApply AI — AI job-search workspace

Upload a CV, sync real jobs (Arbeitnow + Remotive), get AI match scores with
strengths/gaps explanations, and track applications on a kanban board.
Installable as an app (PWA) on iPhone, Android and Windows.

**Access is password-protected.** Before sharing the link, set the password:
Space → **Settings** → **Variables and secrets** → add **secret**
`JOBAAPPLY_AUTH_PASSWORD` → restart the Space when prompted.

## Run locally (Windows)

```powershell
cd JobApply-AI
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\uvicorn backend.main:app --host 0.0.0.0 --port 8123
```

Then open http://127.0.0.1:8123

## Deploy notes

- Deploys as a Docker Space on Hugging Face (see `Dockerfile`)
- `render.yaml` + `DEPLOY_RENDER.md` cover the alternative Render blueprint
