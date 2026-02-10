from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser
from app.db.models.notification import PushSubscription
from app.db.models.cycle_predictor import CycleNotificationSettings

db = SessionLocal()
user_id = 13

# 1. Get User
user = db.query(CycleUser).filter(CycleUser.id == user_id).first()
if not user:
    print("User 13 not found")
    exit()

print(f"USER: {user.nombre_completo} ({user.email})")

# 2. Get Push Subscriptions
subs = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
print(f"\n[PUSH DEVICES] Count: {len(subs)}")
for sub in subs:
    print(f"  - Device: {sub.user_agent}")
    print(f"    Created: {sub.created_at}")

# 3. Get Notification Settings
settings = db.query(CycleNotificationSettings).filter(CycleNotificationSettings.cycle_user_id == user_id).first()

print(f"\n[NOTIFICATION SETTINGS]")
if settings:
    print(f"  - Contraceptives: {'ON' if settings.contraceptive_enabled else 'OFF'} (Time: {settings.contraceptive_time})")
    print(f"  - Rhythm Method: {'ON' if settings.rhythm_method_enabled else 'OFF'}")
    print(f"  - Fertile Window: {'ON' if settings.fertile_window_alerts else 'OFF'}")
    print(f"  - Ovulation: {'ON' if settings.ovulation_alert else 'OFF'}")
    print(f"  - Gyn Checkup: {'ON' if settings.gyn_checkup_alert else 'OFF'}")
    print(f"  - Period Confirmation: {'ON' if settings.period_confirmation_reminder else 'OFF'}")
    print(f"  - Abstinence Alerts: {'ON' if settings.rhythm_abstinence_alerts else 'OFF'}")
else:
    print("  - No settings found (using defaults/creating on first login)")
