
import logging
from sqlalchemy import text
from app.db.base import SessionLocal

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_notifications():
    db = SessionLocal()
    try:
        # 1. Check all settings to see column values
        print("\n--- Listing ALL Notification Settings ---")
        query_all = text("""
            SELECT u.id, u.email, s.contraceptive_enabled, s.contraceptive_time, s.contraceptive_frequency 
            FROM cycle_users u
            JOIN cycle_notification_settings s ON u.id = s.cycle_user_id
        """)
        all_settings = db.execute(query_all).fetchall()
        
        if not all_settings:
            print("The cycle_notification_settings table is EMPTY.")
        else:
            for s in all_settings:
                print(f"User ID: {s.id}, Email: {s.email}, Enabled: {s.contraceptive_enabled}, Time: '{s.contraceptive_time}'")

        # 2. Check the Celery Beat status (if possible via DB/Logs)
        # This script only checks DB.

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_notifications()
