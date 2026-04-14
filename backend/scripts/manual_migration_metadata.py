from app.db.base import SessionLocal
from sqlalchemy import text

def migrate():
    db = SessionLocal()
    try:
        # Check if column exists
        res = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'pending_notifications' AND column_name = 'event_metadata'"))
        row = res.fetchone()
        if not row:
            print("Adding event_metadata column to pending_notifications")
            db.execute(text("ALTER TABLE pending_notifications ADD COLUMN event_metadata JSONB DEFAULT '{}'::jsonb"))
            db.commit()
            print("Column added successfully")
        else:
            print("Column already exists")
    except Exception as e:
        print(f"Error migrating: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
