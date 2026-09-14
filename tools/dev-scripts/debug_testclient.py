from fastapi.testclient import TestClient
import inspect
print(TestClient)
print(inspect.signature(TestClient.__init__))