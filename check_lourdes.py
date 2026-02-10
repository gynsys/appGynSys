from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser
from app.db.models.notification import PushSubscription, NotificationRule
from sqlalchemy import text

db = SessionLocal()
user_id = 13
user = db.query(CycleUser).filter(CycleUser.id == user_id).first()

if not user:
    print("User 13 not found")
else:
    print(f"User: {user.nombre_completo} ({user.email})")
    print(f"Old push_subscription column: {user.push_subscription}")
    
    # Check new PushSubscription table
    subs = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
    print(f"PushSubscriptions count: {len(subs)}")
    for sub in subs:
        print(f"  - Endpoint: {sub.endpoint[:30]}...")
        print(f"  - Created: {sub.created_at}")
        print(f"  - User Agent: {sub.user_agent}")

    # Check User Settings (try to find where they are)
    # Inspect columns related to settings?
    # Based on previous file view, CycleUser had specific columns? 
    # Let's inspect the object dict for any settings-like keys
    print("User attributes:")
    for key, value in user.__dict__.items():
        if not key.startswith('_'):
            print(f"  {key}: {value}")

