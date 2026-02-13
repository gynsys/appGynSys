
import sys
import os
import pytz
from datetime import datetime, timedelta

# Setup path
sys.path.append('/opt/appgynsys/backend')

from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser
from app.db.models.cycle_predictor import CycleNotificationSettings
from app.tasks.email_tasks import send_daily_contraceptive_alert

def verify():
    db = SessionLocal()
    try:
        # 1. Setup User
        email = "marilouh.mh@gmail.com"
        user = db.query(CycleUser).filter(CycleUser.email == email).first()
        if not user:
            print(f"User {email} not found")
            return

        settings = db.query(CycleNotificationSettings).filter(CycleNotificationSettings.cycle_user_id == user.id).first()
        if not settings:
            print("No settings found")
            return

        # 2. Force settings to match NOW
        tz = pytz.timezone('America/Caracas')
        now = datetime.now(tz)
        target_time = now.strftime("%H:%M")
        
        print(f"--- PREPARING TEST FOR {email} ---")
        print(f"Current Time: {target_time}")
        
        settings.contraceptive_enabled = True
        settings.contraceptive_time = target_time
        settings.last_contraceptive_sent_date = now.date() - timedelta(days=1) # Reset sent date
        
        db.commit()
        print("Settings updated to force trigger.")
        
        # 3. Run Task
        print("--- RUNNING TASK ---")
        send_daily_contraceptive_alert()
        print("--- TASK FINISHED ---")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify()
