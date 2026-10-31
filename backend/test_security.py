import sys
sys.path.insert(0, r'D:\AI Powered WEB based Mobile GIS\MOBILE GIS\backend')

# Test importing the main app
from main import app
print("✓ App imported successfully")
print(f"✓ Title: {app.title}")
print(f"✓ Routes: {[r.path for r in app.routes]}")

# Test a simple route
from fastapi.testclient import TestClient
client = TestClient(app)
response = client.get("/api/health")
print(f"✓ Health endpoint: {response.status_code} - {response.json()}")