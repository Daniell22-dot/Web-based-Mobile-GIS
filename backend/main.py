from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="MumiasGIS API",
    description="AI-Powered Mobile GIS backend for Mumias, Kenya",
    version="0.1.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=3600,
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    """Add security headers to every response."""
    response = await call_next(request)

    # Content Security Policy — tighten for production
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://unpkg.com; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "connect-src 'self' http://localhost:8000 https://api.openrouteservice.org; "
        "font-src 'self'; "
        "object-src 'none'; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "frame-ancestors 'self'"
    )
    response.headers["Content-Security-Policy"] = csp

    # Recommended security headers (redundant with middleware but explicit)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    return response


@app.get("/")
async def root():
    return {"message": "MumiasGIS API", "version": "0.1.0"}


@app.get("/api/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "MumiasGIS API"}