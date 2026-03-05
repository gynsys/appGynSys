import sys
import os

# Essential for identifying the 'app' module correctly inside Docker
sys.path.insert(0, "/app")
os.environ["PYTHONPATH"] = "/app"

from app.db.base import engine
from sqlalchemy import text

def migrate():
    print("Attempting to migrate 'push_subscriptions' table...")
    try:
        with engine.connect() as conn:
            # --- Push Subscriptions ---
            print("Migrating 'push_subscriptions'...")
            conn.execute(text("ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS doctor_id INTEGER"))
            try:
                conn.execute(text("ALTER TABLE push_subscriptions ADD CONSTRAINT fk_push_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id)"))
            except Exception: pass
            conn.execute(text("ALTER TABLE push_subscriptions ALTER COLUMN user_id DROP NOT NULL"))
            
            # --- Appointments ---
            print("Migrating 'appointments'...")
            conn.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE"))
            
            conn.commit()
        print("Success: Migration applied.")
    except Exception as e:
        print(f"Error applying migration: {e}")

if __name__ == "__main__":
    migrate()
