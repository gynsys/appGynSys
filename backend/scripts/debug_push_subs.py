import sys
import os
sys.path.insert(0, "/app")
os.environ["PYTHONPATH"] = "/app"

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
            
        if subs:
            print(f"🚀 Enviando Push de prueba a Peta (Total dispositivos: {len(subs)})")
            from app.services.push_service import send_push_to_actor
            res = send_push_to_actor(u30, "🧪 Prueba Peta", "Verificando conexión...")
            print(f"  Result: {res}")
            
    # Doctor 1 (Mariel)
    d1 = db.query(Doctor).filter(Doctor.id == 1).first()
    if d1:
        print(f"Doctor 1 (Mariel): {d1.nombre_completo}")
        subs = db.query(PushSubscription).filter(PushSubscription.doctor_id == 1).all()
        for s in subs:
            print(f"  - Sub ID: {s.id}, Created: {s.created_at}, Endpoint: {s.endpoint[:50]}...")
            
        if subs:
            print(f"🚀 Enviando Push de prueba a Doctora (Total dispositivos: {len(subs)})")
            from app.services.push_service import send_push_to_actor
            res = send_push_to_actor(d1, "🧪 Prueba de GynSys", "¡Hola! Si recibes esto, tu móvil está correctamente vinculado.")
            print(f"  Result: {res}")
    
    db.close()

if __name__ == "__main__":
    debug_subs()
