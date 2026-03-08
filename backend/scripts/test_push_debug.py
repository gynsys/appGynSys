import sys
import os
import json
# Add app directory to sys.path
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.services.push_service import send_push_to_actor
from pywebpush import webpush, WebPushException

from app.db.models.cycle_user import CycleUser

def test_push_actor(actor_id, is_doctor=True):
    db = SessionLocal()
    try:
        if is_doctor:
            actor = db.query(Doctor).filter(Doctor.id == actor_id).first()
            label = "Doctor"
        else:
            actor = db.query(CycleUser).filter(CycleUser.id == actor_id).first()
            label = "CycleUser"

        if not actor:
            print(f"{label} {actor_id} not found")
            return
        
        print(f"Testing push for {label}: {actor.nombre_completo}")
        print(f"Subscriptions: {len(actor.push_subscriptions)}")
        
        result = send_push_to_actor(
            actor=actor,
            title=f"Prueba {label}",
            body="Esta es una prueba técnica para capturar el error de envío."
        )
        
        print(f"Result: {json.dumps(result, indent=2)}")
        
    except Exception as e:
        print(f"FAILED with exception: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    is_doc = "--user" not in sys.argv
    # Get ID from args (last arg if it's a number)
    try:
        target_id = int(sys.argv[-1])
    except ValueError:
        target_id = 1
    
    test_push_actor(target_id, is_doctor=is_doc)
