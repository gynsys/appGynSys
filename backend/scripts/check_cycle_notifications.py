
import sys
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

from app.core.config import settings
from app.db.base import Base
from app.db.models.cycle_user import CycleUser
from app.db.models.cycle_predictor import CycleNotificationSettings, CycleLog, PregnancyLog

# DB Connection
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:gyn13409534@localhost:5432/gynsys")
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def send_test_email(to_email, subject, html_content):
    if not settings.SMTP_USER or "tu_correo" in settings.SMTP_USER:
        print("⚠️ SMTP not configured.")
        return

    try:
        msg = MIMEMultipart()
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_content, "html"))

        print(f"   Connecting to SMTP... {to_email}")
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print("✅ SENT.")
    except Exception as e:
        print(f"❌ Failed: {e}")

def check_cycle_notifications():
    db = SessionLocal()
    try:
        print("--- Checking Cycle Notifications ---")
        users = db.query(CycleUser).filter(CycleUser.is_active == True).all()
        print(f"Found {len(users)} active users.")
        
        for user in users:
            print(f"\nUser: {user.email}")
            settings = db.query(CycleNotificationSettings).filter(CycleNotificationSettings.cycle_user_id == user.id).first()
            if not settings:
                print(" - No settings found.")
                continue
            
            print(f" - Settings: Ovulation={settings.ovulation_alert}, Period={settings.rhythm_method_enabled}")
            
            # Mock sending a 'Welcome/Test' notification to verify connectivity because we can't force a cycle event purely by date without changing DB data
            send_test_email(
                user.email,
                "Prueba de Notificación GynSys",
                f"<h1>Hola {user.nombre_completo}</h1><p>Esta es una prueba para verificar que tu correo está conectado correctamente al sistema de notificaciones del predictor.</p>"
            )

    except Exception as e:
        print(e)
    finally:
        db.close()

if __name__ == "__main__":
    check_cycle_notifications()
