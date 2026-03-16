import sys
import os
from sqlalchemy.orm import Session
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.services.push_service import send_push_to_actor
from app.db.models.push_subscription import PushSubscription

def test_push_per_device(doctor_id: int):
    db = SessionLocal()
    try:
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doctor:
            print(f"Doctor {doctor_id} not found")
            return

        subs = db.query(PushSubscription).filter(PushSubscription.doctor_id == doctor_id).all()
        print(f"Found {len(subs)} subscriptions for Doctor {doctor.nombre_completo}")

        for sub in subs:
            stype = "Capacitor/FCM" if sub.token else "WebPush"
            print(f"\n--- Testing Device ID: {sub.id} ({stype}) ---")
            
            # Mocking the subscriptions list to only contain THIS one
            # because send_push_to_actor iterates over all of them
            # We bypass the generic function and call the logic for one
            
            from app.services.push_service import messaging, webpush, settings, json, WebPushException
            import firebase_admin
            
            payload = {
                "title": "Test GynSys " + stype,
                "body": "Prueba de entrega inmediata individual",
                "icon": "/pwa-192x192.png",
                "badge": "/pwa-192x192.png",
                "data": {"url": "/admin/dashboard"}
            }

            if sub.token:
                try:
                    message = messaging.Message(
                        notification=messaging.Notification(title=payload["title"], body=payload["body"]),
                        data={k: str(v) for k, v in payload["data"].items()},
                        token=sub.token
                    )
                    response = messaging.send(message)
                    print(f"✅ FCM SUCCESS: {response}")
                except Exception as e:
                    print(f"❌ FCM ERROR: {e}")
            else:
                subscription_info = {
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth}
                }
                from pywebpush import webpush
                try:
                    response = webpush(
                        subscription_info=subscription_info,
                        data=json.dumps(payload),
                        vapid_private_key=settings.VAPID_PRIVATE_KEY,
                        vapid_claims={"sub": f"mailto:{settings.VAPID_CLAIM_EMAIL}"}
                    )
                    print(f"✅ WebPush SUCCESS: {response.status_code}")
                except Exception as e:
                    print(f"❌ WebPush ERROR: {e}")

    finally:
        db.close()

if __name__ == "__main__":
    test_push_per_device(1)
