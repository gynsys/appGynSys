import sys
import os
from pathlib import Path

# Explicitly add /app to python path for Docker environment
sys.path.append('/app')

from app.core.config import settings
from app.tasks.email_tasks import _send_smtp_email, send_settings_updated_email
from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser

def test_smtp_direct():
    print(f"--- Testing Direct SMTP Config ---")
    print(f"SMTP Server: {settings.EMAILS_FROM_EMAIL}")
    # Note: sensitive info hidden usually, but we are debugging
    
    # Try sending to a hardcoded email or the first user in DB
    db = SessionLocal()
    user = db.query(CycleUser).filter(CycleUser.is_active == True).first()
    db.close()
    
    if not user:
        print("No active cycle user found to test with.")
        return

    print(f"Attempting to send direct email to: {user.email}")
    
    try:
        _send_smtp_email(
            user.email,
            "GynSys Debug Test Email",
            "<h1>Funciona!</h1><p>Esta es una prueba directa desde el script de debug.</p>"
        )
        print("✅ Direct SMTP send executed without error (check inbox).")
    except Exception as e:
        print(f"❌ Direct SMTP Error: {e}")

def test_celery_task_call():
    print(f"\n--- Testing Celery Task Function Logic (Synchronous) ---")
    db = SessionLocal()
    user = db.query(CycleUser).filter(CycleUser.is_active == True).first()
    db.close()
    
    if not user:
        return

    print(f"Invoking send_settings_updated_email logic synchronously for user ID: {user.id}")
    try:
        # Call the function logic directly, bypassing .delay() to test the code itself
        # Note: Celery tasks are wrappers, but can be called if we didn't use 'bind=True'
        # Since we used @celery_app.task without bind, we can call it? 
        # Actually better to import the function body or just trust the direct SMTP test if that works.
        # But let's try calling the task wrapper.
        send_settings_updated_email(user.id)
        print("✅ Task logic executed successfully.")
    except Exception as e:
        print(f"❌ Task Logic Error: {e}")

if __name__ == "__main__":
    test_smtp_direct()
    test_celery_task_call()
