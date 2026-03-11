from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser
from app.db.models.push_subscription import PushSubscription

db = SessionLocal()
try:
    users_data = db.query(CycleUser.id, CycleUser.email, CycleUser.nombre_completo).join(PushSubscription).distinct().all()
    print("Users Data:", users_data)
    for u in users_data:
        try:
            print("Access by attribute:", u.id, u.email, u.nombre_completo)
        except Exception as e:
            print("Attribute error:", e)
            print("Access by index:", u[0], u[1], u[2])
except Exception as e:
    print("Error:", e)
