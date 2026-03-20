import sys
import os
from sqlalchemy import create_engine, text

sys.path.insert(0, "/app")

def check_user_logs():
    db_url = "postgresql://postgres:GynsysDB2026!Secure@db:5432/gynsys"
    engine = create_engine(db_url)
    
    def safe_print(msg):
        print(str(msg).encode('ascii', 'ignore').decode('ascii'))

    with engine.connect() as conn:
        safe_print("Checking logs for user: likemeve@gmail.com on 2026-03-18...")
        query = text("""
            SELECT l.sent_at, l.notification_type, l.title_sent, l.channel_used, l.status, l.error_message
            FROM notification_logs l
            JOIN cycle_users u ON l.recipient_id = u.id
            WHERE u.email = 'likemeve@gmail.com'
            AND l.sent_at >= '2026-03-18 00:00:00'
            AND l.sent_at < '2026-03-19 00:00:00'
            ORDER BY l.sent_at ASC
        """)
        logs = conn.execute(query).fetchall()
        
        for log in logs:
            safe_print(f"Time: {log[0]} | Type: {log[1]} | Title: {log[2]} | Channel: {log[3]} | Status: {log[4]}")
            if log[5]:
                safe_print(f"  Error: {log[5]}")

if __name__ == "__main__":
    check_user_logs()
