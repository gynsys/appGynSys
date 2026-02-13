
import sys
import os
import pytz
from datetime import datetime, timedelta, date

# Setup path
sys.path.append('/opt/appgynsys/backend')

from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser
from app.db.models.cycle_predictor import CycleNotificationSettings, CycleLog
from app.db.models.notification import NotificationRule
from app.cycle_predictor.logic import calculate_predictions # Found location

def check_schedule():
    db = SessionLocal()
    try:
        print("--- CHECKING SCHEDULE FOR LOURDES ---")
        
        # 1. Fetch User
        email = "marilouh.mh@gmail.com"
        user = db.query(CycleUser).filter(CycleUser.email == email).first()
        if not user:
            print(f"User {email} not found")
            return

        settings = db.query(CycleNotificationSettings).filter(CycleNotificationSettings.cycle_user_id == user.id).first()
        if not settings:
            print("No settings found for user.")
        else:
            print(f"Settings Found. Active: {settings.cycle_fertile_window}")

        # 2. Fetch Last Cycle
        last_cycle = db.query(CycleLog).filter(CycleLog.cycle_user_id == user.id).order_by(CycleLog.start_date.desc()).first()
        
        if not last_cycle:
            print("No cycle logs found.")
            return

        print(f"Last Period Start: {last_cycle.start_date}")
        
        # 3. Calculate Predictions
        print(f"Cycle Config: Avg Length={user.cycle_avg_length}, Period Length={user.period_avg_length}")
        preds = calculate_predictions(last_cycle.start_date, user.cycle_avg_length, user.period_avg_length)
        
        fertile_start = preds["fertile_window_start"]
        ovulation = preds["ovulation_date"]
        
        print(f"Predicted Fertile Start: {fertile_start}")
        print(f"Predicted Ovulation Day: {ovulation}")
        
        # 4. Check Rules
        rules = db.query(NotificationRule).filter(NotificationRule.tenant_id == user.doctor_id).all()
        
        print("\n--- NOTIFICATION SCHEDULE ---")
        print("Note: Daily check runs at 19:00 UTC-4 (La Paz Time)")
        
        tz = pytz.timezone('America/La_Paz')
        
        found_fertile = False
        found_ovulation = False
        
        for rule in rules:
            trigger = rule.trigger_condition
            
            # Fertile Start
            if "is_fertile_start" in trigger and trigger["is_fertile_start"]:
                send_date = fertile_start
                # Logic check: is_fertile_start triggers ON the fertile window start day
                print(f"[MATCH] Rule '{rule.name}' (Fertile Window Start)")
                print(f"        Scheduled for: {send_date} at 19:00 La Paz Time")
                found_fertile = True
                
            # Ovulation
            if "is_ovulation_day" in trigger and trigger["is_ovulation_day"]:
                send_date = ovulation
                # Logic check: is_ovulation_day triggers ON the ovulation day
                print(f"[MATCH] Rule '{rule.name}' (Ovulation Day)")
                print(f"        Scheduled for: {send_date} at 19:00 La Paz Time")
                found_ovulation = True

        if not found_fertile:
             print("[WARNING] No active rule found for 'Fertile Window Start'")
        if not found_ovulation:
             print("[WARNING] No active rule found for 'Ovulation Day'")

    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_schedule()
