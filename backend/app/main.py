from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.api.v1.api import api_router
from app.core.backup_service import backup_scheduler
import logging
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="GynSys API",
    description="SaaS multi-inquilino para clínicas digitales",
    version="1.0.0",
    debug=settings.DEBUG
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.middleware("http")
async def log_user_agent(request, call_next):
    ua = request.headers.get("user-agent", "unknown")
    print(f"[UA-DEBUG] Path: {request.url.path} | UA: {ua}", flush=True)
    return await call_next(request)

# Configure CORS (Must be added last to be the outer-most middleware)
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    # Handle CSV string if necessary
    origins = [o.strip() for o in origins.split(",") if o.strip()]

# Clean and normalize origins (no trailing slashes, ensure strings)
origins = [str(o).strip().rstrip("/") for o in origins]

# Add production domains explicitly for safety
if "https://gynsys.net" not in origins:
    origins.append("https://gynsys.net")
if "https://www.gynsys.net" not in origins:
    origins.append("https://www.gynsys.net")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
# Include API router
# Include API router
app.include_router(api_router, prefix="/api/v1")
# Chat module removed

# Mount static files for uploads


# Mount static files for uploads with CORS support
uploads_path = Path(settings.UPLOAD_DIR).resolve()
uploads_path.mkdir(parents=True, exist_ok=True)

static_app = FastAPI()
static_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for static assets
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
static_app.mount("/", StaticFiles(directory=str(uploads_path)), name="static")
app.mount("/uploads", static_app)

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
    
    try:
        from app.services.notifications import sync_notification_registry_to_db
        from app.services.notifications.base import session_scope
        with session_scope() as db:
            sync_notification_registry_to_db(db)
        logger.info("Sincronización de registro de notificaciones completada.")
    except Exception as e:
        logger.error(f"Error sincronizando registro de notificaciones: {e}")

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

