from app.db.session import SessionLocal
from app.db.models.push_subscription import PushSubscription
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser

db = SessionLocal()

print("--- Push Subscriptions Audit ---")
subs = db.query(PushSubscription).all()
print(f"Total subscriptions: {len(subs)}")

for s in subs:
    owner = "Unknown"
    if s.user_id:
        u = db.query(CycleUser).filter(CycleUser.id == s.user_id).first()
        owner = f"Patient: {u.nombre_completo} ({u.email})" if u else f"Patient ID {s.user_id} (Not found)"
    elif s.doctor_id:
        d = db.query(Doctor).filter(Doctor.id == s.doctor_id).first()
        owner = f"Doctor: {d.nombre_completo} ({d.email})" if d else f"Doctor ID {s.doctor_id} (Not found)"
    
    print(f"ID: {s.id} | Owner: {owner} | Endpoint: {s.endpoint[:30]}...")

print("\n--- Doctors List ---")
doctors = db.query(Doctor).all()
for d in doctors:
    sub_count = db.query(PushSubscription).filter(PushSubscription.doctor_id == d.id).count()
    print(f"Doctor: {d.nombre_completo} | Email: {d.email} | Subs: {sub_count}")

db.close()
