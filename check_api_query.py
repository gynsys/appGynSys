from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser
from app.db.models.notification import PushSubscription

db = SessionLocal()
# Replicate the exact query from the endpoint
users = db.query(CycleUser).join(PushSubscription).distinct().all()

print(f"API_WOULD_RETURN_COUNT: {len(users)}")
for u in users:
    print(f"  - User: {u.email} (ID: {u.id})")
