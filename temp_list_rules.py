import sys
import os
from sqlalchemy import create_engine, text

sys.path.insert(0, "/app")

def list_rules():
    db_url = "postgresql://postgres:GynsysDB2026!Secure@db:5432/gynsys"
    engine = create_engine(db_url)
    
    def safe_print(msg):
        print(str(msg).encode('ascii', 'ignore').decode('ascii'))

    with engine.connect() as conn:
        query = text("""
            SELECT notification_type, title_template, message_template, message_text_template 
            FROM notification_rules 
            WHERE tenant_id IS NULL
            ORDER BY notification_type
        """)
        rules = conn.execute(query).fetchall()
        
        for r in rules:
            title = r[1] if r[1] else ""
            body = r[2] if r[2] else ""
            text_body = r[3] if r[3] else ""
            
            # Search for specific problematic strings in the rule fields
            if "Ciclo" in str(r) or "28" in str(r) or "Maana" in str(r):
                safe_print(f"TYPE: {r[0]}")
                safe_print(f"  TITLE: {title}")
                safe_print(f"  BODY: {body[:50]}...")
                safe_print(f"  TEXT: {text_body[:50]}...")
                safe_print("-" * 20)

if __name__ == "__main__":
    list_rules()
