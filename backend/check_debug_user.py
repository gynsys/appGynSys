from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser
from app.db.models.notification import PushSubscription
from app.core.config import settings
import sys

db = SessionLocal()
email = "marilouh.mh@gmail.com"
user = db.query(CycleUser).filter(CycleUser.email == email).first()

if not user:
    print(f"User {email} not found")
    sys.exit(1)

subs = db.query(PushSubscription).filter(PushSubscription.user_id == user.id).all()
print(f"User: {user.email} (ID: {user.id})")
print(f"Push Subscriptions: {len(subs)}")
for sub in subs:
    print(f"  - ID: {sub.id}, Endpoint: {sub.endpoint[:30]}...")

print("-" * 20)
print(f"SMTP Configured: {bool(settings.SMTP_USER)}")
print(f"SMTP User: {settings.SMTP_USER}")
if "tu_correo" in str(settings.SMTP_USER):
    print("WARNING: SMTP_USER contains placeholder 'tu_correo'")

print(f"VAPID Private Key Configured: {bool(settings.VAPID_PRIVATE_KEY)}")
