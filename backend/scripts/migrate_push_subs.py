import sys
import os

# Essential for identifying the 'app' module correctly inside Docker
sys.path.insert(0, "/app")
os.environ["PYTHONPATH"] = "/app"

from app.db.base import engine
from sqlalchemy import text

def migrate():
    print("Attempting to migrate 'push_subscriptions' table...")
def migrate():
    print("Attempting to migrate tables...")
    
    steps = [
        ("ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS doctor_id INTEGER", "Add doctor_id to push_subscriptions"),
        ("ALTER TABLE push_subscriptions ADD CONSTRAINT fk_push_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id)", "Add FK to push_subscriptions"),
        ("ALTER TABLE push_subscriptions ALTER COLUMN user_id DROP NOT NULL", "Make user_id nullable"),
        ("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE", "Add reminder_sent to appointments")
    ]
    
    for sql, desc in steps:
        print(f"Executing: {desc}...")
        try:
            with engine.connect() as conn:
                conn.execute(text(sql))
                conn.commit()
            print(f"  ✅ Success")
        except Exception as e:
             # If error is about constraint existing, it's fine
            if "already exists" in str(e).lower() or "fk_push_doctor" in str(e).lower():
                print(f"  ℹ️  Note: Constraint/Column might already exist.")
            else:
                print(f"  ❌ Error: {e}")

    print("Migration finished.")

if __name__ == "__main__":
    migrate()
