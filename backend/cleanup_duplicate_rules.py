from app.db.base import SessionLocal
from app.db.models.notification import NotificationRule
from sqlalchemy import func

db = SessionLocal()
try:
    # Find duplicates
    duplicates = db.query(
        NotificationRule.tenant_id, 
        NotificationRule.notification_type, 
        func.count(NotificationRule.id).label('count')
    ).group_by(
        NotificationRule.tenant_id, 
        NotificationRule.notification_type
    ).having(func.count(NotificationRule.id) > 1).all()

    if not duplicates:
        print("No duplicates found.")
    else:
        for tenant_id, notif_type, count in duplicates:
            print(f"Found {count} duplicates for tenant {tenant_id}, type {notif_type}")
            # Keep the one with highest ID
            rules = db.query(NotificationRule).filter(
                NotificationRule.tenant_id == tenant_id,
                NotificationRule.notification_type == notif_type
            ).order_by(NotificationRule.id.desc()).all()
            
            to_delete = rules[1:] # All except the first (latest)
            for r in to_delete:
                print(f"  Deleting rule ID {r.id}")
                db.delete(r)
        
        db.commit()
    print("Cleanup complete.")
except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
