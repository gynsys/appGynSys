from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser
from sqlalchemy import or_

db = SessionLocal()
lourdes = db.query(CycleUser).filter(
    or_(
        CycleUser.email.ilike("%lourdes%"),
        CycleUser.nombre_completo.ilike("%lourdes%")
    )
).all()

print(f"LOURDES_FOUND: {len(lourdes)}")
for u in lourdes:
    print(f"User: {u.id}, Email: {u.email}, Name: {u.nombre_completo}, HasPush: {u.push_subscription is not None}")
