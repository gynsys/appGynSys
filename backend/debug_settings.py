import sys
import os
# Add backend to path to import app
sys.path.append(os.path.join(os.getcwd(), 'backend'))
try:
    from app.core.config import settings
    print(f"DATABASE_URL: {settings.DATABASE_URL}")
    print(f"DEBUG: {settings.DEBUG}")
    print(f"CORS_ORIGINS: {settings.CORS_ORIGINS}")
except Exception as e:
    print(f"Error loading settings: {e}")
