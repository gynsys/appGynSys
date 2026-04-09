from app.db.session import SessionLocal
from app.db.models.notification import PendingNotification, NotificationRule
from app.services.notifications.sender import send_dual_notification_logic
from sqlalchemy import text

def verify_doctor_push_logic():
    db = SessionLocal()
    try:
        # 1. Create a dummy rule if it doesn't exist
        # We'll use the real doctor_unified_onboarding rule for test
        rule = db.query(NotificationRule).filter(NotificationRule.notification_type == 'doctor_unified_onboarding').first()
        if not rule:
            print("ERROR: doctor_unified_onboarding rule not found.")
            return

        # 2. Create a dummy pending notification for doctor_id = 1
        pending = PendingNotification(
            notification_rule_id=rule.id,
            doctor_id=1,
            subject="Test de Diagnóstico Post-Fix",
            body="Si lees esto, la lógica de actor para doctores funciona.",
            status="pending",
            channel="dual"
        )
        db.add(pending)
        db.commit()
        db.refresh(pending)
        
        print(f"DEBUG: Created pending notification ID {pending.id}")
        
        # 3. Dry run the sender logic (we won't actually send but check actor resolution)
        # We need to monkeypatch send_push_to_actor and _send_integrated_email to avoid actual sending
        import app.services.notifications.sender as sender
        from unittest.mock import MagicMock
        
        original_push = sender.send_push_to_actor
        original_email = sender._send_integrated_email
        
        sender.send_push_to_actor = MagicMock(return_value={"success": True, "message": "Simulated success"})
        sender._send_integrated_email = MagicMock(return_value=True)
        
        try:
            success, channel, error, image = send_dual_notification_logic(db, pending)
            print(f"DEBUG: Result -> Success: {success}, Channel: {channel}, Error: {error}")
            
            # Verify if push was attempted (means actor was found)
            if sender.send_push_to_actor.called:
                call_args = sender.send_push_to_actor.call_args[1]
                actor = call_args.get('actor')
                print(f"DEBUG: Push attempted to Actor: {actor.nombre_completo if actor else 'None'} (Type: {type(actor).__name__})")
            else:
                print("DEBUG: Push NOT attempted.")
                
        finally:
            sender.send_push_to_actor = original_push
            sender._send_integrated_email = original_email
            
            # Cleanup
            db.delete(pending)
            db.commit()
            
    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    verify_doctor_push_logic()
