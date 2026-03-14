from app.db.session import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.push_subscription import PushSubscription
import json

def diagnose_doctor_push(doctor_email: str):
    db = SessionLocal()
    try:
        doctor = db.query(Doctor).filter(Doctor.email == doctor_email).first()
        if not doctor:
            print(f"Doctor with email {doctor_email} NOT FOUND.")
            return

        print(f"--- Diagnostic for Doctor: {doctor.nombre_completo} (ID: {doctor.id}) ---")
        print(f"Email: {doctor.email}")
        print(f"Is Admin: {doctor.is_admin}")
        
        subscriptions = db.query(PushSubscription).filter(PushSubscription.doctor_id == doctor.id).all()
        
        print(f"\nFound {len(subscriptions)} subscription(s):")
        for i, sub in enumerate(subscriptions):
            print(f"\nSubscription {i+1}:")
            print(f"  Type: {'Native' if sub.token else 'Web'}")
            print(f"  Token: {sub.token[:20]}..." if sub.token else f"  Endpoint: {sub.endpoint[:40]}...")
            print(f"  Updated At: {sub.updated_at}")
            
    finally:
        db.close()

if __name__ == "__main__":
    # Suponiendo que el email del inquilino mariel es el que se usa habitualmente
    # El usuario mencionó "inquilino mariel", buscaremos doctores relacionados con ese nombre si el email no es obvio
    diagnose_doctor_push("marielherrera@gmail.com") # Basado en el nombre Dra. Mariel Herrera del navbar
