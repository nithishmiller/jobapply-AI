"""Minimal Gmail SMTP mailer for the OTP reset flow.

Setup (owner, one time):
  1. In the Google Account (zerax6111@gmail.com): Security -> 2-Step Verification
     must be ON, then Security -> App passwords -> create one for "Mail".
  2. Paste the 16-character app password into JobApply-AI/.gmail_app
     (16 letters, no spaces - e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop").
  3. Restart the app.

The recipient is fixed to the owner (.owner_email) - the endpoint can never
be abused to spam third parties. Sends are additionally rate-limited in auth.py.
"""
import smtplib
import ssl
from email.message import EmailMessage
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
APP_PASSWORD_FILE = BASE_DIR / ".gmail_app"
OWNER_EMAIL_FILE = BASE_DIR / ".owner_email"

OWNER_EMAIL = "zerax6111@gmail.com"  # fallback; .owner_email overrides
_SUBJECT = "JobApply AI - your reset code"
_BODY = """Hi,

Your JobApply AI password-reset code is:

  {code}

It expires in 10 minutes and can be used once.
If you didn't request this, you can safely ignore this email.

- JobApply AI (running on your PC)
"""


def owner_email() -> str:
    if OWNER_EMAIL_FILE.exists():
        return OWNER_EMAIL_FILE.read_text(encoding="utf-8").strip() or OWNER_EMAIL
    return OWNER_EMAIL


def gmail_configured() -> bool:
    return APP_PASSWORD_FILE.exists() and APP_PASSWORD_FILE.read_text(encoding="utf-8").strip() != ""


def send_otp(code: str) -> None:
    """Send the OTP to the owner. Raises on any failure."""
    if not gmail_configured():
        raise RuntimeError(
            "Gmail app password is not set up yet. Add it to JobApply-AI/.gmail_app "
            "(Google Account > Security > App passwords) and restart the app."
        )
    app_pw = APP_PASSWORD_FILE.read_text(encoding="utf-8").strip().replace(" ", "")

    msg = EmailMessage()
    msg["From"] = owner_email()
    msg["To"] = owner_email()
    msg["Subject"] = _SUBJECT
    msg.set_content(_BODY.format(code=code))

    ctx = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ctx, timeout=20) as smtp:
        smtp.login(owner_email(), app_pw)
        smtp.send_message(msg)
