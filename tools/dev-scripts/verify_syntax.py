import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

try:
    from endpoints import jobs
    print("jobs module imported successfully")
except Exception as e:
    print(f"Failed to import jobs module: {e}")
    sys.exit(1)

try:
    from endpoints import applications
    print("applications module imported successfully")
except Exception as e:
    print(f"Failed to import applications module: {e}")
    sys.exit(1)

try:
    from backend.main import app
    print("main app imported successfully")
except Exception as e:
    print(f"Failed to import main app: {e}")
    sys.exit(1)

# Check that routers are included
try:
    routes = [route.path for route in app.routes]
    print(f"Registered routes: {routes}")
    # Check for expected prefixes
    assert any(route.startswith('/jobs') for route in routes), "Jobs router not included"
    assert any(route.startswith('/applications') for route in routes), "Applications router not included"
    assert any(route.startswith('/cvs') for route in routes), "CVs router not included"
    print("All expected routers are present.")
except Exception as e:
    print(f"Error checking routes: {e}")
    sys.exit(1)

print("All syntax and import checks passed.")