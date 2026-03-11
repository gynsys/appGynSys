import json
from pywebpush import webpush
from app.core.config import settings
from app.db.base import get_db
from app.db.models.push_subscription import PushSubscription

def send_minimal_push(doc_id: int):
    db_gen = get_db()
    db = next(db_gen)
    try:
        subs = db.query(PushSubscription).filter(PushSubscription.doctor_id == doc_id).all()
        if not subs:
            print(f"No subscriptions for doctor {doc_id}")
            return

        payload = {
            "title": "Prueba Simple",
            "body": "Si ves esto, el sistema base funciona.",
            "icon": "/pwa-192x192.png",
            "data": {"url": "/admin/dashboard"}
        }

        for sub in subs:
            print(f"Enviando a sub ID {sub.id}...")
            try:
                response = webpush(
                    subscription_info={
                        "endpoint": sub.endpoint,
                        "keys": {"p256dh": sub.p256dh, "auth": sub.auth}
                    },
                    data=json.dumps(payload),
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": f"mailto:{settings.EMAILS_FROM_EMAIL}"}
                )
                print(f"  Resultado: {response.status_code}")
            except Exception as e:
                print(f"  Error: {e}")

    finally:
        try:
            next(db_gen)
        except StopIteration:
            pass

if __name__ == "__main__":
    send_minimal_push(1)
