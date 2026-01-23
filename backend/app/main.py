"""
Main FastAPI application entry point.
"""
# Backend Main Entry Point (Reload Triggered)
# Backend Main Entry Point (Reload Triggered 2)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.api.v1.api import api_router
from app.core.backup_service import backup_scheduler
import logging

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="GynSys API",
    description="SaaS multi-inquilino para clínicas digitales",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "https://gynsys.netlify.app",
        "https://appgynsys.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")
from app.chat.api import router as chat_router
app.include_router(chat_router, prefix="/api/v1/chat", tags=["chat"])

# Mount Socket.IO
from app.chat.websockets import app as socket_app
# Mount at root because socket.io client connects to /socket.io by default at the root
# But since this is ASGI, we can just replace the 'app' export OR mount.
# Mounting at / causes issues with FastAPI routes.
# The standard solution is to wrap FastAPI with socketio.
app.mount("/ws", socket_app) # This maps localhost:8000/ws/socket.io
# Client must connect to url: "http://localhost:8000", path: "/ws/socket.io"


# Mount static files for uploads
uploads_path = Path(settings.UPLOAD_DIR).resolve()
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# Mount static files for sample-gallery (default images)
sample_gallery_path = Path(__file__).parent.parent / "sample-gallery"
sample_gallery_path.mkdir(parents=True, exist_ok=True)
app.mount("/sample-gallery", StaticFiles(directory=str(sample_gallery_path)), name="sample-gallery")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "GynSys API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event():
    """Lógica al iniciar la aplicación."""
    # Iniciar programador de backups en segundo plano (cada 1 hora)
    import asyncio
    asyncio.create_task(backup_scheduler(interval_seconds=3600))
    logger.info("Tarea de backup automático programada.")
    
    # Ensure S3 Bucket Exists
    try:
        from app.core.s3 import ensure_bucket_exists
        # Run in threadpool since it's sync blocking io
        # or just run it if it's fast enough. 
        # Better: run_in_executor
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, ensure_bucket_exists)
        logger.info("Verificación de bucket S3 completada.")
    except Exception as e:
        logger.error(f"Error inicializando S3: {e}")

