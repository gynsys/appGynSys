
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

from app.db.base import Base
from app.db.models.cycle_user import CycleUser

# DB Connection
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:gyn13409534@127.0.0.1:5432/gynsys")
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def wipe_data():
    db = SessionLocal()
    try:
        print("--- Wiping Cycle Predictor Data ---")
        
        # We can use Cascade Delete if configured, or delete related tables manually first
        # Deleting CycleUser should cascade to Logs, Settings, etc if ForeignKeys are set correctly.
        # Let's try deleting users directly.
        
        num_deleted = db.query(CycleUser).delete()
        db.commit()
        
        print(f"✅ Deleted {num_deleted} cycle users and their related data.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error wiping data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if input("Are you sure you want to delete ALL cycle users? (y/n): ").lower() == 'y':
        wipe_data()
    else:
        print("Aborted.")
