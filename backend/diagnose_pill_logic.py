from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser
from app.db.models.cycle_predictor import CycleNotificationSettings, PregnancyLog
from datetime import datetime, date
import pytz

def diagnose():
    db = SessionLocal()
    
    # 1. Server Time
    tz = pytz.timezone('America/Caracas')
    now = datetime.now(tz)
    print(f"Server Time (America/Caracas): {now}")
    print(f"Current Hour: {now.hour}, Minute: {now.minute}")

    # 2. Find User
    users = db.query(CycleUser).filter(CycleUser.is_active == True).all()
    print(f"Found {len(users)} active users")

    for user in users:
        print(f"\n--- Checking User: {user.email} ---")
        
        # Settings
        settings = db.query(CycleNotificationSettings).filter(
            CycleNotificationSettings.cycle_user_id == user.id
        ).first()
        
        if not settings:
            print("  [X] No settings found")
            continue
            
        print(f"  Settings: Enabled={settings.contraceptive_enabled}, Time={settings.contraceptive_time}, LastSent={settings.last_contraceptive_sent_date}")
        
        if not settings.contraceptive_enabled:
            print("  [X] Contraceptive not enabled")
            continue

        if not settings.contraceptive_time:
            print("  [X] No time set")
            continue

        # Logic Check
        try:
            u_h, u_m = map(int, settings.contraceptive_time.split(':'))
            diff_h = abs(u_h - now.hour)
            diff_m = abs(u_m - now.minute)
            
            print(f"  Target Time: {u_h}:{u_m:02d}")
            print(f"  Diff Hour: {diff_h}")
            print(f"  Diff Minute: {diff_m}")
            
            # Interval is 5 mins, so we check +/- 3 mins
            if diff_h == 0 and diff_m < 3:
                 print("  [MATCH] Time is within window! Notification SHOULD send.")
            else:
                 print("  [NO MATCH] Time outside window.")
                 
            # Check Last Sent
            # RULE REMOVED
            # if settings.last_contraceptive_sent_date == now.date():
            #    print("  [BLOCK] Already sent today.")
            # else:
            #    print("  [READY] Not sent today.")

        except Exception as e:
            print(f"  [ERROR] Parsing time: {e}")

if __name__ == "__main__":
    diagnose()
