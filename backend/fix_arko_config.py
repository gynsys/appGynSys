from app.db.base import SessionLocal
from sqlalchemy import text

def fix_db():
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE arko_admins ADD COLUMN IF NOT EXISTS site_config JSONB"))
        db.commit()
        print("Arko tables fixed successfully: site_config added to arko_admins.")
    except Exception as e:
        print(f"Error fixing DB: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_db()
