import sys
sys.path.insert(0, "backend")
from main import app
from fastapi.testclient import TestClient

client = TestClient(app)
r = client.get("/api/health")
print(f"Health endpoint: {r.status_code} - {r.json()}")

# List routes
print("Registered routes:")
for route in app.routes:
    if hasattr(route, "methods") and hasattr(route, "path"):
        print(f"  {route.methods} {route.path}")