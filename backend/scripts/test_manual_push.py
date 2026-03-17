from app.db.base import SessionLocal
from app.services.notifications.processor import trigger_doctor_event
import asyncio

async def test_manual_push():
    db = SessionLocal()
    try:
        # Dra Mariel is doctor_id = 1
        doctor_id = 1
        
        print(f"Triggering high-level doctor event for ID {doctor_id}...")
        
        # We use trigger_doctor_event which handles rendering and queuing
        trigger_doctor_event(
            db=db,
            doctor_id=doctor_id,
            notification_type="doctor_new_contact_message",
            context={
                "doctor_name": "Mariel Herrera",
                "patient_name": "Test System (Antigravity)",
                "message_preview": "¡Prueba de sistema! Si ves esto, tus dos dispositivos están vinculados correctamente."
            }
        )
        
        print("Doctor event triggered. Notifications should be processed shortly.")
        print("Check docker logs for [GynSysPush] lines for real-time delivery status.")

    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_manual_push())
