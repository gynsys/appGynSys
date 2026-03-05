from app.db.base import SessionLocal
from app.db.models.push_subscription import PushSubscription
from app.db.models.cycle_user import CycleUser
from app.db.models.doctor import Doctor

def debug_subs():
    db = SessionLocal()
    print("--- DEBUG PUSH SUBSCRIPTIONS ---")
    
    # User 30 (peta)
    u30 = db.query(CycleUser).filter(CycleUser.id == 30).first()
    if u30:
        print(f"User 30 (peta): {u30.nombre_completo}")
        subs = db.query(PushSubscription).filter(PushSubscription.user_id == 30).all()
        for s in subs:
            print(f"  - Sub ID: {s.id}, Created: {s.created_at}, Endpoint: {s.endpoint[:50]}...")
    
    # Doctor 1 (Mariel)
    d1 = db.query(Doctor).filter(Doctor.id == 1).first()
    if d1:
        print(f"Doctor 1 (Mariel): {d1.nombre_completo}")
        subs = db.query(PushSubscription).filter(PushSubscription.doctor_id == 1).all()
        for s in subs:
            print(f"  - Sub ID: {s.id}, Created: {s.created_at}, Endpoint: {s.endpoint[:50]}...")
    
    db.close()

if __name__ == "__main__":
    debug_subs()
