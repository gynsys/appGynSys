import sys
import os
from sqlalchemy import text

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base import Base, engine
from app.db.models.endometriosis_result import EndometriosisResult

def update_schema():
    print("Updating database schema...")
    
    # 1. Create EndometriosisResult table
    try:
        print("Creating endometriosis_results table...")
        EndometriosisResult.__table__.create(bind=engine)
        print("Table endometriosis_results created successfully.")
    except Exception as e:
        print(f"Table might already exist: {e}")

    # 2. Add visitor_count to doctors table
    try:
        print("Adding visitor_count to doctors table...")
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS visitor_count INTEGER DEFAULT 0"))
            conn.commit()
        print("Column visitor_count added successfully.")
    except Exception as e:
        print(f"Error adding column (it might exist): {e}")

if __name__ == "__main__":
    update_schema()
