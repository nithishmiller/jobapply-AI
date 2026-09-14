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
import time
from pathlib import Path
from urllib.parse import quote

from fastapi import APIRouter, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse

from utils.mailer import gmail_configured, owner_email, send_otp

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


def set_password(new_password: str) -> None:
    """Persist a new access password (used by the OTP reset flow)."""
    PASSWORD_FILE.write_text(new_password, encoding="utf-8")
    global _PASSWORD
    _PASSWORD = new_password


# ---------------------------------------------------------------------------
# OTP reset flow — in-memory store; survives until restart, which is fine
# for a single-user app. Codes are single-use and expire in 10 minutes.
# ---------------------------------------------------------------------------
_otp_store: dict[str, tuple[str, float]] = {}   # code_hash -> (purpose, created_ts)
_OTP_TTL = 10 * 60
_last_send = 0.0
_SEND_COOLDOWN = 45          # seconds between sends
_MAX_ATTEMPTS = 5
_failed_attempts = 0


def _hash_code(code: str) -> str:
    return hmac.new(_SECRET.encode(), code.strip().encode(), hashlib.sha256).hexdigest()


def _otp_window_open() -> bool:
    now = time.time()
    # drop expired codes
    for k in [k for k, (_, ts) in _otp_store.items() if now - ts > _OTP_TTL]:
        _otp_store.pop(k, None)
    return bool(_otp_store)


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

    # ---- forgot password: email OTP ---------------------------------------
    global _last_send, _failed_attempts

    @router.get("/auth/forgot")
    def forgot_status():
        return JSONResponse({"owner_email": owner_email(), "gmail_configured": gmail_configured()})

    @router.post("/auth/forgot")
    def forgot_send():
        global _last_send
        now = time.time()
        if now - _last_send < _SEND_COOLDOWN:
            wait = int(_SEND_COOLDOWN - (now - _last_send))
            return JSONResponse(status_code=429, content={"detail": f"Please wait {wait}s before requesting another code."})
        if not gmail_configured():
            return JSONResponse(status_code=503, content={"detail": "Email delivery is not set up on the server yet (missing Gmail app password)."})
        code = f"{secrets.randbelow(1000000):06d}"
        _otp_store.clear()          # one live code at a time
        _otp_store[_hash_code(code)] = ("reset", now)
        try:
            send_otp(code)
        except Exception as exc:
            _otp_store.pop(_hash_code(code), None)
            return JSONResponse(status_code=502, content={"detail": f"Could not send email: {exc}"})
        _last_send = now
        masked = owner_email()
        name, _, domain = masked.partition("@")
        masked = (name[:2] + "\u2022" * max(len(name) - 2, 1) + "@" + domain) if domain else masked
        return JSONResponse({"sent_to": masked, "expires_in": _OTP_TTL})

    @router.post("/auth/reset")
    def reset_password(code: str = Form(""), new_password: str = Form("")):
        global _failed_attempts
        code = code.strip()
        new_password = new_password.strip()
        if len(new_password) < 6:
            return JSONResponse(status_code=400, content={"detail": "New password must be at least 6 characters."})
        digest = _hash_code(code)
        entry = _otp_store.get(digest)
        if not entry or time.time() - entry[1] > _OTP_TTL:
            return JSONResponse(status_code=400, content={"detail": "Invalid or expired code. Request a new one."})
        _otp_store.pop(digest)      # single-use
        set_password(new_password)
        _failed_attempts = 0
        resp = RedirectResponse("/", status_code=303)
        resp.set_cookie(COOKIE_NAME, _make_token(), max_age=60 * 60 * 24 * 90,
                        httponly=True, samesite="lax", path="/")
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
      <h2 id="reset-title">Reset your access</h2>
      <button type="button" class="auth-help-close" id="auth-help-close" aria-label="Close">×</button>
    </div>

    <div id="reset-step-1">
      <p>We'll email a 6-digit code to the owner's address, then you set a new password.</p>
      <button type="button" class="btn btn-primary auth-btn" id="send-otp-btn">
        <span>Email me a code</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3.5 7.5 12 13l8.5-5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" stroke-width="1.8"/></svg>
      </button>
      <p class="auth-dim" id="reset-note">Delivery needs the app's Gmail setup on the server.</p>
    </div>

    <div id="reset-step-2" hidden>
      <p>Code sent to <strong id="otp-sent-to"></strong>. It expires in 10 minutes.</p>
      <form id="reset-form">
        <input class="auth-input auth-code-input" id="otp-code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6"
               placeholder="6-digit code" autocomplete="one-time-code" required>
        <div class="auth-field">
          <input class="auth-input" id="new-pw" type="password" placeholder="New password (min 6 chars)"
                 autocomplete="new-password" minlength="6" required>
          <button type="button" class="pw-toggle" id="newpw-toggle" aria-label="Show password" title="Show password">
            <svg class="ico-eye" width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7"/></svg>
            <svg class="ico-eye-off" width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true" hidden><path d="M4 4l16 16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M9.9 5.2A9.6 9.6 0 0 1 12 5c6 0 9.5 7 9.5 7a17.6 17.6 0 0 1-3 3.9M6.2 6.9A16.5 16.5 0 0 0 2.5 12s3.5 7 9.5 7a9.3 9.3 0 0 0 4-.9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.9 9.6a3 3 0 0 0 4.3 4.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
          </button>
        </div>
        <button class="btn btn-primary auth-btn" type="submit"><span>Set new password &amp; sign in</span></button>
        <button type="button" class="auth-forgot" id="resend-link" style="margin-top:10px">Resend code</button>
      </form>
    </div>

    <div class="auth-error" id="reset-error" hidden></div>
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
  var step1 = document.getElementById('reset-step-1');
  var step2 = document.getElementById('reset-step-2');
  var resetErr = document.getElementById('reset-error');
  var forgotBtn = document.getElementById('forgot-link');
  if (forgotBtn) forgotBtn.addEventListener('click', function () {
    help.hidden = false;
    card.classList.add('dimmed');
    help.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  var sendBtn = document.getElementById('send-otp-btn');
  var resendLink = document.getElementById('resend-link');
  var cooldownTimer = null;

  function showResetError(msg) {
    resetErr.textContent = msg;
    resetErr.hidden = false;
  }
  function startCooldown(seconds) {
    var left = seconds;
    var update = function () {
      if (left <= 0) {
        clearInterval(cooldownTimer);
        sendBtn.disabled = false;
        sendBtn.querySelector('span').textContent = 'Email me a code';
        resendLink.textContent = 'Resend code';
        return;
      }
      sendBtn.disabled = true;
      sendBtn.querySelector('span').textContent = 'Wait ' + left + 's\u2026';
      resendLink.textContent = 'Resend (' + left + 's)';
      left--;
    };
    clearInterval(cooldownTimer);
    cooldownTimer = setInterval(update, 1000);
    update();
  }

  function requestOtp() {
    resetErr.hidden = true;
    sendBtn.disabled = true;
    sendBtn.querySelector('span').textContent = 'Sending\u2026';
    fetch('/auth/forgot', { method: 'POST' })
      .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, d: d }; }); })
      .then(function (_a) {
        var ok = _a.ok, d = _a.d;
        if (!ok) { showResetError(d.detail || 'Could not send the code.'); sendBtn.disabled = false; sendBtn.querySelector('span').textContent = 'Email me a code'; return; }
        document.getElementById('otp-sent-to').textContent = d.sent_to;
        step1.hidden = true;
        step2.hidden = false;
        document.getElementById('otp-code').focus();
        startCooldown(45);
      })
      .catch(function () { showResetError('Network error - is the app server running?'); sendBtn.disabled = false; sendBtn.querySelector('span').textContent = 'Email me a code'; });
  }

  sendBtn.addEventListener('click', requestOtp);
  resendLink.addEventListener('click', requestOtp);

  document.getElementById('auth-help-close').addEventListener('click', function () {
    help.hidden = true;
    card.classList.remove('dimmed');
  });

  /* new-password visibility toggle (same eye pattern) */
  var npw = document.getElementById('new-pw');
  var nToggle = document.getElementById('newpw-toggle');
  nToggle.addEventListener('click', function () {
    var show = npw.type === 'password';
    npw.type = show ? 'text' : 'password';
    nToggle.querySelector('.ico-eye').hidden = show;
    nToggle.querySelector('.ico-eye-off').hidden = !show;
    npw.focus();
  });

  /* OTP input: digits only */
  var codeInput = document.getElementById('otp-code');
  codeInput.addEventListener('input', function () {
    codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 6);
  });

  document.getElementById('reset-form').addEventListener('submit', function (e) {
    e.preventDefault();
    resetErr.hidden = true;
    var body = new URLSearchParams();
    body.set('code', codeInput.value);
    body.set('new_password', npw.value);
    fetch('/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      redirect: 'follow',
    })
      .then(function (res) {
        if (res.redirected || res.ok) { location.href = '/'; return; }
        return res.json().then(function (d) { showResetError(d.detail || 'Reset failed.'); });
      })
      .catch(function () { showResetError('Network error.'); });
  });
})();
</script>
</body>
</html>"""
