from app.services.notifications.base import session_scope
from app.db.models.notification import NotificationRule
from sqlalchemy import func

def check_duplicates():
    with session_scope() as db:
        # Check for duplicate types per tenant
        dupes = db.query(
            NotificationRule.notification_type, 
            NotificationRule.tenant_id, 
            func.count(NotificationRule.id)
        ).group_by(
            NotificationRule.notification_type, 
            NotificationRule.tenant_id
        ).having(func.count(NotificationRule.id) > 1).all()
        
        if dupes:
            print("DUPLICATES FOUND (Type, Tenant, Count):")
            for d in dupes:
                print(f" - {d[0]}, {d[1]}, {d[2]}")
        else:
            print("No duplicate notification_type found per tenant.")

        # Summary of counts per tenant
        counts = db.query(
            NotificationRule.tenant_id, 
            func.count(NotificationRule.id)
        ).group_by(NotificationRule.tenant_id).all()
        print("\nNotification rules counts per tenant:")
        for c in counts:
            print(f" - Tenant {c[0]}: {c[1]} rules")

if __name__ == "__main__":
    check_duplicates()
