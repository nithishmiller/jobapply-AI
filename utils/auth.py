"""Password gate for the shared/public link.

- Password lives in `.auth_password` (created on first run, editable).
- Secret lives in `.auth_secret` (created on first run). Session cookies are
  HMAC-signed with it, so logins survive server restarts without a session
  store.
- Everything is protected except: /auth/*, /health, /static/css/style.css
  (needed to render the login page).
"""
import hashlib
import hmac
import os
import secrets
from pathlib import Path
from urllib.parse import quote

from fastapi import APIRouter, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse

BASE_DIR = Path(__file__).resolve().parent.parent
PASSWORD_FILE = BASE_DIR / ".auth_password"
SECRET_FILE = BASE_DIR / ".auth_secret"

COOKIE_NAME = "jobapply_session"


def _ensure_files() -> tuple[str, str]:
    if not SECRET_FILE.exists():
        SECRET_FILE.write_text(secrets.token_hex(32), encoding="utf-8")
    if not PASSWORD_FILE.exists():
        # readable default; user should change it in .auth_password
        PASSWORD_FILE.write_text("jobapply-gold", encoding="utf-8")
    # Env vars win over files so a deployed instance can set its own
    # password without committing secrets to the repo.
    password = os.environ.get("JOBAAPPLY_AUTH_PASSWORD", "").strip() \
        or PASSWORD_FILE.read_text(encoding="utf-8").strip()
    secret = os.environ.get("JOBAAPPLY_AUTH_SECRET", "").strip() \
        or SECRET_FILE.read_text(encoding="utf-8").strip()
    return password, secret


_PASSWORD, _SECRET = _ensure_files()


def _make_token() -> str:
    return hmac.new(_SECRET.encode(), b"jobapply-session-v1", hashlib.sha256).hexdigest()


def _valid_session(request: Request) -> bool:
    tok = request.cookies.get(COOKIE_NAME, "")
    return bool(tok) and hmac.compare_digest(tok, _make_token())


# Paths that must stay open for the login page to work.
_OPEN_PREFIXES = ("/auth", "/static/css/style.css", "/health")


def install_auth(app) -> None:
    router = APIRouter()

    @router.get("/auth/login", response_class=HTMLResponse)
    def login_form(error: str = ""):
        err = (
            '<div class="auth-error" role="alert">'
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
            '<circle cx="12" cy="12" r="9.2" stroke="currentColor" stroke-width="1.8"/>'
            '<path d="M12 7.6v5.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
            '<circle cx="12" cy="16.4" r="1.15" fill="currentColor"/></svg>'
            "<span>Wrong password — try again.</span></div>"
            if error
            else ""
        )
        html = _LOGIN_PAGE.replace("%%ERROR%%", err)
        return HTMLResponse(html)

    @router.post("/auth/login")
    def login(password: str = Form("")):
        if hmac.compare_digest(password.strip(), _PASSWORD):
            resp = RedirectResponse("/", status_code=303)
            resp.set_cookie(
                COOKIE_NAME,
                _make_token(),
                max_age=60 * 60 * 24 * 90,  # 90 days
                httponly=True,
                samesite="lax",
                path="/",
            )
            return resp
        return RedirectResponse("/auth/login?error=1", status_code=303)

    @router.get("/auth/logout")
    def logout():
        resp = RedirectResponse("/auth/login", status_code=303)
        resp.delete_cookie(COOKIE_NAME, path="/")
        return resp

    app.include_router(router)

    @app.middleware("http")
    async def _gate(request: Request, call_next):
        path = request.url.path
        if path == "/" or not any(path.startswith(p) for p in _OPEN_PREFIXES):
            if not _valid_session(request):
                if request.method == "GET" and path != "/":
                    return RedirectResponse(
                        "/auth/login?next=" + quote(path), status_code=303
                    )
                return RedirectResponse("/auth/login", status_code=303)
        return await call_next(request)


_LOGIN_PAGE = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#faf6ee">
<title>JobApply AI — Sign in</title>
<link rel="stylesheet" href="/static/css/style.css?v=12">
</head>
<body>
<div class="bg-fx" aria-hidden="true"></div>
<main class="auth-wrap">
  <form class="auth-card" method="post" action="/auth/login" autocomplete="off">
    <div class="brand-mark auth-mark" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2.5 14.6 8l6 .9-4.3 4.2 1 6-5.3-2.8L6.7 19l1-6L3.4 8.9l6-.9L12 2.5Z" fill="#fffdf8"/>
      </svg>
    </div>
    <h1>JobApply AI</h1>
    <p class="auth-sub">Your private AI job-search workspace.<br>Enter the access password to continue.</p>
    %%ERROR%%

    <div class="auth-field">
      <input class="auth-input" id="auth-pw" type="password" name="password"
             placeholder="Access password" autocomplete="current-password" autofocus required>
      <button type="button" class="pw-toggle" id="pw-toggle" aria-label="Show password" title="Show password">
        <svg class="ico-eye" width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7"/>
        </svg>
        <svg class="ico-eye-off" width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true" hidden>
          <path d="M4 4l16 16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
          <path d="M9.9 5.2A9.6 9.6 0 0 1 12 5c6 0 9.5 7 9.5 7a17.6 17.6 0 0 1-3 3.9M6.2 6.9A16.5 16.5 0 0 0 2.5 12s3.5 7 9.5 7a9.3 9.3 0 0 0 4-.9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9.9 9.6a3 3 0 0 0 4.3 4.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <button class="btn btn-primary auth-btn" type="submit">
      <span>Sign in</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <button type="button" class="auth-forgot" id="forgot-link">Forgot password?</button>
  </form>

  <div class="auth-help" id="auth-help" hidden>
    <div class="auth-help-head">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4.2" y="10.2" width="15.6" height="10" rx="2.4" stroke="currentColor" stroke-width="1.7"/>
        <path d="M8 10V8a4 4 0 0 1 8 0v2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        <circle cx="12" cy="15.2" r="1.4" fill="currentColor"/>
      </svg>
      <h2>Reset your access</h2>
      <button type="button" class="auth-help-close" id="auth-help-close" aria-label="Close">×</button>
    </div>
    <p>The password is stored on the machine running this app, in one plain-text file:</p>
    <code class="auth-code">JobApply-AI\.auth_password</code>
    <p><strong>To set a new password:</strong> edit that file with any text editor,
    save your new password inside it, then restart the app<br>
    <span class="auth-dim">(double-click <code>JobApply-AI\tools\Start JobApply AI.bat</code>).</span></p>
    <p class="auth-dim">No server access? Ask the person who shared this link with you —
    only they can reset it.</p>
  </div>
</main>

<script>
(function () {
  var pw = document.getElementById('auth-pw');
  var toggle = document.getElementById('pw-toggle');
  var eye = toggle.querySelector('.ico-eye');
  var eyeOff = toggle.querySelector('.ico-eye-off');
  toggle.addEventListener('click', function () {
    var show = pw.type === 'password';
    pw.type = show ? 'text' : 'password';
    eye.hidden = show;
    eyeOff.hidden = !show;
    toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    pw.focus();
  });

  var help = document.getElementById('auth-help');
  var card = document.querySelector('.auth-card');
  document.getElementById('forgot-link').addEventListener('click', function () {
    help.hidden = false;
    card.classList.add('dimmed');
    help.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  document.getElementById('auth-help-close').addEventListener('click', function () {
    help.hidden = true;
    card.classList.remove('dimmed');
  });
})();
</script>
</body>
</html>"""
