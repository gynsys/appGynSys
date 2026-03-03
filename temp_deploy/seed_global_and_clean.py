import sys
from app.db.session import SessionLocal
from app.db.models.notification import NotificationRule
from app.seeds.notification_rules import seed_notification_rules

def run():
    db = SessionLocal()
    
    print("Deleting old prenatal_week_X rules from ALL tenants and global...")
    deleted = db.query(NotificationRule).filter(
        NotificationRule.notification_type.like("prenatal_week_%")
    ).delete(synchronize_session=False)
    db.commit()
    print(f"Deleted {deleted} legacy prenatal week rules.")
    
    print("Seeding global notification rules (tenant_id = None)...")
    seed_notification_rules(db, None)
    
    print("Seeding rules for known tenants if necessary...")
    # Get all distinct tenant_ids that are not None
    tenants = db.execute("SELECT id FROM doctors").fetchall()
    for (t_id,) in tenants:
        seed_notification_rules(db, t_id)
        
    print("Done! Global rules updated.")

if __name__ == "__main__":
    run()
