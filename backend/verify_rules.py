from app.db.base import SessionLocal
from app.db.models.notification import NotificationRule

db =SessionLocal()
try:
    rules = db.query(NotificationRule).filter(NotificationRule.tenant_id == 1).all()
    print(f"Total rules for tenant 1: {len(rules)}\n")
    for r in rules:
        print(f"{r.notification_type:30} | Active: {r.is_active} | Channel: {r.channel:5} | Time: {r.send_time}")
finally:
    db.close()
