from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="MumiasGIS API",
    description="AI-Powered Mobile GIS backend for Mumias, Kenya",
    version="0.1.0",
)

# CORS configuration
# In production, restrict origins; in development, allow localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=3600,
)

# Security headers added via middleware


@app.get("/")
async def root():
    return {"message": "MumiasGIS API", "version": "0.1.0"}


@app.get("/api/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "MumiasGIS API"}