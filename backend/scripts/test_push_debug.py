import sys
import os
import json
# Add app directory to sys.path
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.services.push_service import send_push_to_actor
from pywebpush import webpush, WebPushException

def test_push_doctor(doctor_id):
    db = SessionLocal()
    try:
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doctor:
            print(f"Doctor {doctor_id} not found")
            return
        
        print(f"Testing push for Doctor: {doctor.nombre_completo}")
        print(f"Subscriptions: {len(doctor.push_subscriptions)}")
        
        result = send_push_to_actor(
            actor=doctor,
            title="Detección de Error",
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
    doc_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    test_push_doctor(doc_id)
