"""
Script to list all users in the database.
"""
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models.doctor import Doctor

def list_users():
    """List all users."""
    print(f"Database URL: {settings.DATABASE_URL}")
    
    # Create engine
    engine = create_engine(settings.DATABASE_URL)

    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    try:
        users = session.query(Doctor).all()
        print(f"Found {len(users)} users:")
        for user in users:
            print(f" - ID: {user.id}")
            print(f"   Email: '{user.email}'")
            print(f"   Role: {user.role}")
            print(f"   Active: {user.is_active}")
            print(f"   Password Hash: {user.password_hash[:20]}...")
            print("-" * 20)

    except Exception as e:
        print(f"❌ Error listing users: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    list_users()
