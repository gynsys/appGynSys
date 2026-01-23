import sys
from pathlib import Path
from sqlalchemy import text, inspect
# Add backend directory to path BEFORE importing app
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.base import engine

def verify_appointment_columns():
    print(f"Connecting to DB: {engine.url}")
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('appointments')]
    print(f"Columns in 'appointments': {columns}")
    
    if 'occupation' in columns and 'residence' in columns:
        print("SUCCESS: Columns exist.")
    else:
        print("FAILURE: Columns missings.")
        # Try to force add them again
        with engine.connect() as conn:
            trans = conn.begin()
            try:
                if 'occupation' not in columns:
                    print("Attempting to add 'occupation'...")
                    conn.execute(text("ALTER TABLE appointments ADD COLUMN occupation VARCHAR"))
                if 'residence' not in columns:
                    print("Attempting to add 'residence'...")
                    conn.execute(text("ALTER TABLE appointments ADD COLUMN residence VARCHAR"))
                trans.commit()
                print("Columns added successfully.")
            except Exception as e:
                print(f"Error adding columns: {e}")
                trans.rollback()

if __name__ == "__main__":
    verify_appointment_columns()
