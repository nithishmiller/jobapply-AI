# Deploy JobApply AI to Render (free, permanent URL)

You get a permanent link like `https://jobapply-ai.onrender.com` — no domain purchase, no credit card.

## One-time setup (~10 minutes)

1. **Push this folder to GitHub**
   - Create an account at github.com (free) if you don't have one
   - Create a new **private** repository, e.g. `jobapply-ai`
   - Then locally:
     ```bash
     cd JobApply-AI
     git init
     git add .
     git commit -m "JobApply AI — initial deploy"
     git branch -M main
     git remote add origin https://github.com/YOURNAME/jobapply-ai.git
     git push -u origin main
     ```
   - `.gitignore` already excludes secrets (`.auth_password`), your database and uploads.

2. **Create the Render service**
   - Sign up at render.com with your GitHub account (free, no card)
   - Dashboard → **New +** → **Blueprint**
   - Pick your `jobapply-ai` repo → Render reads `render.yaml`
   - When asked for `JOBAAPPLY_AUTH_PASSWORD`, enter your access password
     (this is what visitors will type on the login page — set it before sharing)
   - Click **Apply** → wait ~3–5 min for the first build

3. **Your permanent link appears in the dashboard**: `https://jobapply-ai.onrender.com`
   - Install on iPhone via Safari → Share → Add to Home Screen — this link **never changes**

## What works / what differs from your PC version

| | PC (tunnel) | Render (cloud) |
|---|---|---|
| Link | changes on reboot | **permanent** |
| Always on | only while PC runs | always, but **sleeps after 15 min idle** (first visit wakes it, ~30–60 s) |
| Database | your local `jobapply.db` | fresh + lives on Render's disk — **resets on redeploy** |
| Job sync | works | works (same live APIs) |

**Recommended flow:** use the Render link to *share* with friends and for a permanent phone install; keep uploading your real CV and tracking applications on the PC version, where data persists.

## Notes

- Free Render instances need no payment info. Render may ask to verify identity by card for **some** account features — if that screen appears and you don't want to add a card, cancel; the blueprint deploy itself doesn't require one.
- The service worker/manifest and all PWA features work identically on Render.
- To update the app after changes: `git add . && git commit -m "update" && git push` — Render redeploys automatically.
