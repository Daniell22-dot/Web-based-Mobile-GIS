from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    
    # OpenRouteService
    ORS_API_KEY: str = Field(..., env="ORS_API_KEY")
    
    # Application
    DEBUG: bool = Field(True, env="DEBUG")
    ENVIRONMENT: str = Field("development", env="ENVIRONMENT")
    
    # CORS
    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )
    
    # Trusted hosts
    TRUSTED_HOSTS: str = Field("", env="TRUSTED_HOSTS")
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = Field(100, env="RATE_LIMIT_PER_MINUTE")
    
    # Next.js frontend env vars (must be included to avoid validation errors)
    NEXT_PUBLIC_APP_NAME: str = Field("MumiasGIS", env="NEXT_PUBLIC_APP_NAME")
    NEXT_PUBLIC_APP_DESCRIPTION: str = Field("AI-Powered Mobile GIS for Mumias, Kenya", env="NEXT_PUBLIC_APP_DESCRIPTION")
    NEXT_PUBLIC_NODE_ENV: str = Field("development", env="NEXT_PUBLIC_NODE_ENV")
    NEXT_PUBLIC_API_URL: str = Field("http://localhost:8000/api", env="NEXT_PUBLIC_API_URL")
    BACKEND_API_URL: str = Field("http://localhost:8000", env="BACKEND_API_URL")
    
    # OpenAI/OpenRouteService optional
    OPENWEATHERMAP_API_KEY: str = Field("", env="OPENWEATHERMAP_API_KEY")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()