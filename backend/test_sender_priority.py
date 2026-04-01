import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.db.models.notification import PendingNotification
from app.db.models.cycle_user import CycleUser
from app.services.notifications.sender import send_dual_notification_logic

def run_verify():
    db = SessionLocal()
    try:
        # Simulation: A user that has 'milanopabloe@gmail.com' in their profile (likely the doctor account)
        user = db.query(CycleUser).first()
        if not user:
            print("No users found to test metadata logic.")
            return

        # Pre-check: What email does the profile have?
        profile_email = user.email
        print(f"Profile Email (found in user record): {profile_email}")

        # The Campaign Snapshot: We want to send to 'unicobnb20@gmail.com'
        target_direct = "unicobnb20@gmail.com"
        
        # Create a mock notification
        # recipient_id=user.id (this used to cause the redirect to profile_email)
        # recipient_email_direct=target_direct (this SHOULD override)
        item = PendingNotification(
            subject="VERIFICACION PRIORIDAD",
            body="Si lees esto, el sistema ahora respeta el snapshot de la campaña.",
            recipient_id=user.id,
            recipient_email_direct=target_direct,
            doctor_id=1
        )

        print(f"Attempting to resolve recipient for notification with Direct Email: {target_direct} and User ID: {user.id}")
        
        # We manually call the logic (but we won't actually trigger the send to Resend here if we just want to check the email_address)
        # BUT the best way is to let it run and check the logs.
        # Actually, let's just print what the code resolves.
        # I'll add a temporary print in sender.py if needed, or just trust the logic.
        
        success, channel, error = send_dual_notification_logic(db, item)
        print(f"Result: {success}, Channel: {channel}, Error: {error}")
        
    finally:
        db.close()

if __name__ == "__main__":
    run_verify()
