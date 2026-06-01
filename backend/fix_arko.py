from app.db.base import SessionLocal
from sqlalchemy import text

def fix_db():
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE arko_posts ADD COLUMN IF NOT EXISTS seo_config JSONB"))
        db.execute(text("CREATE TABLE IF NOT EXISTS arko_admins (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, hashed_password VARCHAR(255) NOT NULL, full_name VARCHAR(255), is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"))
        db.commit()
        print("Arko tables fixed successfully.")
    except Exception as e:
        print(f"Error fixing DB: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_db()
