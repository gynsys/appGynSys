import os
import sys

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.base import SessionLocal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migration():
    """Add is_verified and verification_token columns to cycle_users table."""
    db = SessionLocal()
    try:
        # Check if columns exist
        result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='cycle_users' AND column_name='is_verified'"))
        if result.fetchone():
            logger.info("Column 'is_verified' already exists.")
        else:
            db.execute(text("ALTER TABLE cycle_users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE"))
            logger.info("Added 'is_verified' column to cycle_users.")

        result2 = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='cycle_users' AND column_name='verification_token'"))
        if result2.fetchone():
            logger.info("Column 'verification_token' already exists.")
        else:
            db.execute(text("ALTER TABLE cycle_users ADD COLUMN verification_token VARCHAR(255) NULL"))
            logger.info("Added 'verification_token' column to cycle_users.")

        # Optional: Set existing users to verified so we don't block old patients unexpectedly
        db.execute(text("UPDATE cycle_users SET is_verified = TRUE WHERE is_verified IS FALSE OR is_verified IS NULL"))
        logger.info("Set existing cycle_users to is_verified = TRUE for backward compatibility.")

        db.commit()
        logger.info("Migration completed successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
