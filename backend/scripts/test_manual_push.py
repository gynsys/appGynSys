from app.db.base import SessionLocal
from app.db.models.push_subscription import PushSubscription
from app.services.notifications.sender import send_dual_notification_logic
import asyncio

async def test_manual_push():
    db = SessionLocal()
    try:
        # Dra Mariel is doctor_id = 1
        doctor_id = 1
        
        print(f"Triggering manual push test for Doctor ID {doctor_id}...")
        
        # We simulate a "new contact message" event
        success = await send_dual_notification_logic(
            db=db,
            doctor_id=doctor_id,
            notification_type="doctor_new_contact_message",
            context={
                "doctor_name": "Mariel Herrera",
                "patient_name": "Test System (Antigravity)",
                "message_preview": "¡Prueba de sistema! Si ves esto, tus dos dispositivos están vinculados correctamente."
            }
        )
        
        print(f"Push dispatch process finished. Status: {'SUCCESS' if success else 'FAILED'}")
        print("Check docker logs for [GynSysPush] lines to see delivery details.")

    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_manual_push())
