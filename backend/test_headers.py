import sys
sys.path.insert(0, "backend")
from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

# Test health
r = client.get("/api/health")
print(f"Health: {r.status_code} - {r.json()}")

# Test CORS and security headers
print(f"CORS origin: {r.headers.get('access-control-allow-origin')}")
print(f"X-Content-Type-Options: {r.headers.get('X-Content-Type-Options')}")
print(f"X-Frame-Options: {r.headers.get('X-Frame-Options')}")
print(f"X-XSS-Protection: {r.headers.get('X-XSS-Protection')}")
print(f"Referrer-Policy: {r.headers.get('Referrer-Policy')}")
print(f"Content-Security-Policy: {r.headers.get('Content-Security-Policy')}")