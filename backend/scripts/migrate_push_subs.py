from app.db.base import engine
from sqlalchemy import text

def migrate():
    print("Attempting to migrate 'push_subscriptions' table...")
    try:
        with engine.connect() as conn:
            # 1. Add doctor_id column
            conn.execute(text("ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS doctor_id INTEGER"))
            
            # 2. Add foreign key constraint (if not already exists - slightly harder in PG without a check, but we try)
            try:
                conn.execute(text("ALTER TABLE push_subscriptions ADD CONSTRAINT fk_push_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id)"))
            except Exception as e:
                print(f"Note (Constraint might exist): {e}")
            
            # 3. Make user_id nullable
            conn.execute(text("ALTER TABLE push_subscriptions ALTER COLUMN user_id DROP NOT NULL"))
            
            conn.commit()
        print("Success: Migration applied.")
    except Exception as e:
        print(f"Error applying migration: {e}")

if __name__ == "__main__":
    migrate()
