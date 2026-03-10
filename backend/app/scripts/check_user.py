from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser
from app.db.models.cycle_predictor import PregnancyLog, SymptomLog

db = SessionLocal()
user = db.query(CycleUser).filter(CycleUser.email=="dramarielh@gmail.com").first()

if user:
    print(f"User found: {user.nombre_completo}, Photo URL: {user.photo_url}")
    pregs = db.query(PregnancyLog).filter(PregnancyLog.cycle_user_id==user.id).all()
    print(f"Pregnancies: {len(pregs)}")
    for p in pregs:
        print(f"  - Active: {p.is_active}, LMP: {p.last_period_date}, Due: {p.due_date}")
else:
    print("User not found")
