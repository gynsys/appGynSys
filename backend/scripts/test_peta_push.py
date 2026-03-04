import sys
import os

# Essential for identifying the 'app' module correctly inside Docker
sys.path.insert(0, "/app")
os.environ["PYTHONPATH"] = "/app"

from sqlalchemy.orm import Session
from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser
from app.services.push_service import send_push_notification

def send_test_to_peta():
    db = SessionLocal()
    try:
        # Peta ID is 30
        user = db.query(CycleUser).filter(CycleUser.id == 30).first()
        if not user:
            print("❌ User 'peta' (ID 30) not found.")
            return

        print(f"✅ User found: {user.nombre_completo} (ID: {user.id})")
        print(f"   Subscriptions: {len(user.push_subscriptions)}")

        if not user.push_subscriptions:
            print("❌ User has no push subscriptions.")
            return

        result = send_push_notification(
            user=user,
            title="🔔 Prueba de GynSys",
            body="Hola Peta, esta es una notificación corregida. Al tocarla debería llevarte a tu Dashboard en la PWA. 🚀",
            data={"url": "/cycle/dashboard"}
        )

        if result.get("success"):
            print(f"🚀 SUCCESS: {result['message']}")
        else:
            print(f"❌ FAILED: {result.get('error')}")

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    send_test_to_peta()
