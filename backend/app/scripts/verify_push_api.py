from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser
from app.db.models.push_subscription import PushSubscription
import json

db = SessionLocal()
try:
    users_data = db.query(CycleUser.id, CycleUser.email, CycleUser.nombre_completo).join(PushSubscription).distinct().all()
    count = len(users_data)
    users = [
        {
            "id": u.id,
            "email": u.email,
            "name": u.nombre_completo or u.email.split('@')[0]
        }
        for u in users_data
    ]
    result = {
        "success": True,
        "count": count,
        "users": users
    }
    print(json.dumps(result, indent=2))
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
