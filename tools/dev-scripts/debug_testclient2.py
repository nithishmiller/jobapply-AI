from fastapi.testclient import TestClient
from backend.main import app

# Try positional argument
client = TestClient(app)
print("TestClient created successfully")

# Try keyword argument
client2 = TestClient(app=app)
print("TestClient with keyword created successfully")