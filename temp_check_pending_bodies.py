import sys
import os
from sqlalchemy import create_engine, text

sys.path.insert(0, "/app")

def check_pending():
    db_url = "postgresql://postgres:GynsysDB2026!Secure@db:5432/gynsys"
    engine = create_engine(db_url)
    
    def safe_print(msg):
        print(str(msg).encode('ascii', 'ignore').decode('ascii'))

    with engine.connect() as conn:
        safe_print("Checking PendingNotifications for missing message_text...")
        query = text("""
            SELECT count(*) 
            FROM pending_notifications 
            WHERE message_text IS NULL OR message_text = ''
        """)
        count = conn.execute(query).scalar()
        safe_print(f"Total pending without text: {count}")

        if count > 0:
            query_details = text("""
                SELECT p.id, p.scheduled_for, r.notification_type, p.subject, p.status
                FROM pending_notifications p
                JOIN notification_rules r ON p.notification_rule_id = r.id
                WHERE p.message_text IS NULL OR p.message_text = ''
                LIMIT 15
            """)
            details = conn.execute(query_details).fetchall()
            for d in details:
                safe_print(f"ID: {d[0]} | Sched: {d[1]} | Type: {d[2]} | Sub: {d[3]} | Status: {d[4]}")

if __name__ == "__main__":
    check_pending()
