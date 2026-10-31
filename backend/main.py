from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import register_routes

app = FastAPI(
    title="MumiasGIS API",
    description="AI-Powered Mobile GIS backend for Mumias, Kenya",
    version="0.1.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
register_routes(app)


@app.get("/")
async def root():
    return {"message": "MumiasGIS API", "version": "0.1.0"}