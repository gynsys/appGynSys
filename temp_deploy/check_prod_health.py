from app.services.notifications import get_notification_system_health
from app.db.session import SessionLocal
import json

db = SessionLocal()
health = get_notification_system_health(db)
db.close()
print(json.dumps(health, indent=2))
