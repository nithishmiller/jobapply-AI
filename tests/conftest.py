"""Pytest isolation: never touch the real jobapply.db.

DATABASE_URL is redirected to a temp SQLite file BEFORE any app module is
imported (conftest loads first), so database.connection binds its engine to
the throwaway DB. Uploads go to a temp dir too.
"""
import os
import sys
import tempfile
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

_TMP = tempfile.mkdtemp(prefix="jobapply-test-")
os.environ["DATABASE_URL"] = "sqlite:///" + (Path(_TMP) / "test.db").as_posix()
os.environ["UPLOAD_DIR"] = _TMP
# deterministic auth for tests (the real password file is never read)
os.environ.setdefault("JOBAAPPLY_AUTH_PASSWORD", "test-password-123")
