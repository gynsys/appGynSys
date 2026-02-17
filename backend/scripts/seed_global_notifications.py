from sqlalchemy import create_engine, text
import os
import sys

db_url = os.environ.get("DATABASE_URL", "postgresql://postgres:gyn13409534@127.0.0.1:5433/gynsys")
engine = create_engine(db_url)

# Add parent dir to sys.path for app imports
sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))
from app.core.notifications.registry import NOTIFICATION_REGISTRY

print(f"Registry has {len(NOTIFICATION_REGISTRY)} rules.")

with engine.begin() as con:
    print("--- STEP 1: Dropping problematic indexes/constraints ---")
    # Drop known indexes/constraints if they exist
    con.execute(text("DROP INDEX IF EXISTS idx_rule_tenant_type"))
    con.execute(text("DROP INDEX IF EXISTS idx_rule_type_tenant"))
    con.execute(text("ALTER TABLE notification_rules DROP CONSTRAINT IF EXISTS idx_rule_type_tenant"))
    con.execute(text("ALTER TABLE notification_rules DROP CONSTRAINT IF EXISTS idx_rule_tenant_type"))
    
    print("--- STEP 2: Truncating table ---")
    con.execute(text("TRUNCATE TABLE notification_rules RESTART IDENTITY CASCADE"))
    
    # Verify count is 0
    count = con.execute(text("SELECT count(*) FROM notification_rules")).scalar()
    print(f"Count after truncate: {count}")
    
    print("--- STEP 3: Seeding rules ---")
    inserted = 0
    for rule_def in NOTIFICATION_REGISTRY:
        rtype = rule_def["type"]
        title = rule_def["title"]
        message = rule_def["message"]
        priority = rule_def.get("priority", 50)
        
        # Use simple prints to avoid console encoding issues
        try:
            con.execute(text(
                "INSERT INTO notification_rules "
                "(tenant_id, notification_type, title_template, message_template, "
                "message_text_template, trigger_condition, priority, channel, send_time, is_active, is_edited) "
                "VALUES "
                "(:tid, :ntype, :title, :msg, :msg_text, :trigger, :pri, :chan, :stime, :active, :edited)"
            ), {
                "tid": None,
                "ntype": rtype,
                "title": title,
                "msg": message,
                "msg_text": message,
                "trigger": "{}",
                "pri": priority,
                "chan": "dual",
                "stime": "08:00",
                "active": True,
                "edited": False
            })
            inserted += 1
            if inserted % 20 == 0:
                print(f"  Inserted {inserted} rules...")
        except Exception as e:
            print(f"ERROR inserting {rtype}: {str(e)}")
            raise e
            
    print(f"Total inserted: {inserted}")
    
    print("--- STEP 4: Recreating unique index ---")
    con.execute(text(
        "CREATE UNIQUE INDEX idx_rule_type_tenant "
        "ON notification_rules (notification_type, tenant_id)"
    ))
    
    print("--- STEP 5: Final Verification ---")
    final_count = con.execute(text("SELECT count(*) FROM notification_rules")).scalar()
    print(f"Final count in DB: {final_count}")

print("SUCCESS!")
