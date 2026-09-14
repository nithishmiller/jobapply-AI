# Deploy JobApply AI to Hugging Face Spaces (free, permanent, no card)

Permanent link like `https://YOURNAME-jobapply.hf.space` — no credit card, ever.

## One-time setup (~10 min)

### 1. Push to GitHub
If you already created a GitHub repo for Render, skip this — same repo works.

Otherwise: github.com → **+** → New repository → name `jobapply-ai` → **Private** → Create, then:
```bash
cd JobApply-AI
git remote add origin https://github.com/YOURNAME/jobapply-ai.git
git push -u origin main
```

### 2. Create the Space
1. Sign up at huggingface.co (free, no card)
2. Click **New** → **Space**
3. Space name: `jobapply` (the URL becomes `https://YOURNAME-jobapply.hf.space`)
4. SDK: **Docker** → Blank template → **Public** visibility
   *(public is fine — the app itself is password-gated)*
5. Create Space

### 3. Connect it to your code — pick ONE:

**Option A — link GitHub (simplest):** In the Space → **Files** tab → you can
upload the files directly (drag the whole project folder), or

**Option B — push with git (recommended for updates):**
```bash
# HF gives you its own git remote on the Space page (⋯ → clone)
git remote add space https://huggingface.co/spaces/YOURNAME/jobapply
git push --force space main
```
HF builds the Docker image automatically (~3–5 min first time).

### 4. Set the password (IMPORTANT before sharing)
Space → **Settings** → **Variables and secrets** → **New secret**:
- Name: `JOBAAPPLY_AUTH_PASSWORD`
- Value: the access password visitors will type

The Space restarts and the login page now accepts it.
(`JOBAAPPLY_AUTH_SECRET` is optional — HF generates one per boot if unset;
sessions then reset on restart, which is fine.)

## What you get

| | PC tunnel | HF Space |
|---|---|---|
| Link | rotates on reboot | **permanent** |
| Cost | free | **free, no card** |
| Sleep | — | only after **~48 h idle** (wake ~1–2 min) |
| Database | your local one | fresh on the Space (resets on rebuild) |

**Recommended:** share the HF link + keep your PC version as the data master.
Both run the same code — uploads on the Space stay on the Space.

## Updating the app
```bash
git add . && git commit -m "update" && git push          # GitHub
git push space main                                       # HF rebuilds
```
