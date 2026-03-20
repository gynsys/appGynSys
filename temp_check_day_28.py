import sys
import os
from sqlalchemy import create_engine, text

# Force /app for path
sys.path.insert(0, "/app")

def check_rule():
    db_url = "postgresql://postgres:GynsysDB2026!Secure@db:5432/gynsys"
    engine = create_engine(db_url)
    
    def safe_print(msg):
        print(str(msg).encode('ascii', 'ignore').decode('ascii'))

    with engine.connect() as conn:
        safe_print("Checking day_28_period_tomorrow rule...")
        query = text("""
            SELECT id, notification_type, title_template, message_template, message_text_template 
            FROM notification_rules 
            WHERE notification_type = 'day_28_period_tomorrow'
            AND tenant_id IS NULL
        """)
        rule = conn.execute(query).fetchone()
        
        if rule:
            safe_print(f"ID: {rule[0]}")
            safe_print(f"Type: {rule[1]}")
            safe_print(f"Title Tpl: {rule[2]}")
            safe_print(f"HTML Tpl: {rule[3]}")
            safe_print(f"Text Tpl: {rule[4]}")
        else:
            safe_print("Rule NOT FOUND")

        safe_print("\nChecking recent logs for day_28_period_tomorrow...")
        query_logs = text("""
            SELECT l.sent_at, l.status, l.title_sent, l.channel_used, u.email
            FROM notification_logs l
            JOIN cycle_users u ON l.recipient_id = u.id
            WHERE l.notification_type = 'day_28_period_tomorrow'
            ORDER BY l.sent_at DESC
            LIMIT 15
        """)
        logs = conn.execute(query_logs).fetchall()
        for log in logs:
            safe_print(f"User: {log[4]} | Sent: {log[0]} | Status: {log[1]} | Title: {log[2]} | Channel: {log[3]}")

if __name__ == "__main__":
    check_rule()
