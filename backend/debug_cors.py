from app.core.config import settings
print(f"DEBUG_CORS_ORIGINS: {settings.CORS_ORIGINS}")
print(f"TYPE: {type(settings.CORS_ORIGINS)}")
for o in settings.CORS_ORIGINS:
    print(f" - '{o}'")
