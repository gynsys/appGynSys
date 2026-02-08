"""
Configuration module for GynSys Backend.
Uses Pydantic BaseSettings to load environment variables.
"""

from pydantic_settings import BaseSettings
from typing import Optional, List, Union
from pydantic import AnyHttpUrl, validator



class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    # DATABASE_URL: str = "sqlite:///./gynsys.db"
    DATABASE_URL: str = "postgresql://postgres:gyn13409534@db:5432/gynsys"

    # JWT Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: Optional[str] = None

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:5174", 
        "http://127.0.0.1:5174",
        "https://gynsys.netlify.app",
        "https://appgynsys.onrender.com",
        "https://gynsys.net",
        "https://www.gynsys.net",
        "https://api.gynsys.net"
    ]

    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            # Permite formato JSON o CSV
            if v.startswith("["):
                import json
                return json.loads(v)
            return [i.strip() for i in v.split(",")]
        return v

    # Debug flag (read from .env; useful for local development)
    DEBUG: bool = False

    # Celery & Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # File Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB

    # Data Encryption
    ENCRYPTION_KEY: str = "r4Pn0YDQH7obBlPFuPHzWj_hEWLotrVUHonpkba_fn8="

    # Email Settings (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "tu_correo@gmail.com"
    SMTP_PASSWORD: str = "tu_contraseña_de_aplicacion"
    EMAILS_FROM_EMAIL: str = "no-reply@gynsys.com"
    EMAILS_FROM_NAME: str = "GynSys Notificaciones"
    
    # MinIO / S3
    MINIO_ENDPOINT: str = "minio:9000" # Internal Docker URL
    MINIO_PUBLIC_ENDPOINT: str = "http://localhost:9000" # URL accessible from Browser
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "gynsys-media"

    # VAPID (Web Push)
    VAPID_PRIVATE_KEY: Optional[str] = None
    VAPID_PUBLIC_KEY: Optional[str] = None
    VAPID_CLAIM_EMAIL: str = "admin@gynsys.com"
    
    class Config:
        # Check both local .env and Render's secret path
        import os
        render_env = "/etc/secrets/.env"
        if os.path.exists(render_env):
            env_file = render_env
        else:
            env_file = ".env"
            
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


# Global settings instance
settings = Settings()

