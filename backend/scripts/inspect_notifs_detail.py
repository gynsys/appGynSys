import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:GynsysDB2026!Secure@db:5432/gynsys")

def inspect_notifs():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Checking recent notifications...")
        res = conn.execute(text("SELECT subject, status, recipient_email_direct, channel, created_at FROM pending_notifications ORDER BY created_at DESC LIMIT 10"))
        notifs = res.fetchall()
        for n in notifs:
            print(f"  Subject: {n.subject}, Status: {n.status}, Email: {n.recipient_email_direct}, Channel: {n.channel}, Created: {n.created_at}")

        print("\nChecking if those notifications have a link to notification_rules (which they don't from campaigns)")
        res = conn.execute(text("SELECT count(*) FROM pending_notifications WHERE notification_rule_id IS NULL"))
        print(f"  Count without rule (Campaigns): {res.scalar()}")

if __name__ == "__main__":
    inspect_notifs()
