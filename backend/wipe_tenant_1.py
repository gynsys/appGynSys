from app.db.base import SessionLocal
from app.db.models.notification import NotificationRule
db = SessionLocal()
try:
    num_deleted = db.query(NotificationRule).filter(NotificationRule.tenant_id == 1).delete()
    db.commit()
    print(f"Wiped {num_deleted} rules for tenant 1")
finally:
    db.close()
