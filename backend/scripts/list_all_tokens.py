from app.db.base import SessionLocal
from app.db.models.push_subscription import PushSubscription
import json

db = SessionLocal()
try:
    subs = db.query(PushSubscription).filter(PushSubscription.token != None).all()
    results = []
    for s in subs:
        results.append({
            "id": s.id,
            "doctor_id": s.doctor_id,
            "user_id": s.user_id,
            "token": s.token,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None
        })
    print(json.dumps(results, indent=2))
finally:
    db.close()
