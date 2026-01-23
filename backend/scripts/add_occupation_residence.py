import sys
from pathlib import Path
from sqlalchemy import text
# Add backend directory to path BEFORE importing app
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.base import engine

def migrate_appointments():
    print("Starting Appointment Schema Migration...")
    
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # Add columns if not exist
            conn.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS occupation VARCHAR"))
            conn.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS residence VARCHAR"))
            
            trans.commit()
            print("Successfully added 'occupation' and 'residence' columns to 'appointments'.")
            
        except Exception as e:
            print(f"Migration Error: {e}")
            trans.rollback()

if __name__ == "__main__":
    migrate_appointments()
