from app.db.base import SessionLocal
from app.db.models.push_subscription import PushSubscription
import json

db = SessionLocal()
try:
    subs = db.query(PushSubscription).filter(PushSubscription.doctor_id == 1).all()
    results = []
    for s in subs:
        results.append({
            "id": s.id,
            "type": "Capacitor/FCM" if s.token else "WebPush (PWA)",
            "token": s.token,
            "endpoint": s.endpoint,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None
        })
    print(json.dumps(results, indent=2))
finally:
    db.close()
