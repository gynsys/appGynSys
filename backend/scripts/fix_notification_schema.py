import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:GynsysDB2026!Secure@db:5432/gynsys")

def fix_schema():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Checking and adding missing columns to pending_notifications...")
        try:
            conn.execute(text("ALTER TABLE pending_notifications ADD COLUMN IF NOT EXISTS recipient_email_direct VARCHAR(255)"))
            conn.execute(text("ALTER TABLE pending_notifications ADD COLUMN IF NOT EXISTS recipient_name_direct VARCHAR(255)"))
            print("Successfully added columns to pending_notifications")
        except Exception as e:
            print(f"Error adding to pending_notifications: {e}")

        print("Checking and adding missing columns to notification_logs...")
        try:
            conn.execute(text("ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS recipient_email_direct VARCHAR(255)"))
            conn.execute(text("ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS recipient_name_direct VARCHAR(255)"))
            print("Successfully added columns to notification_logs")
        except Exception as e:
            print(f"Error adding to notification_logs: {e}")
            
        conn.commit()
    print("Schema fix completed!")

if __name__ == "__main__":
    fix_schema()
