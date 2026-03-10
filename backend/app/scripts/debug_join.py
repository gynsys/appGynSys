from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser
from app.db.models.push_subscription import PushSubscription

db = SessionLocal()
try:
    users_data = db.query(CycleUser.id, CycleUser.email, CycleUser.nombre_completo).join(PushSubscription).distinct().all()
    print("Users Data:", users_data)
except Exception as e:
    print("Error:", e)
