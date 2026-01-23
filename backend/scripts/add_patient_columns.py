import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def add_columns():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        # Add patient_dni
        try:
            conn.execute(text("ALTER TABLE appointments ADD COLUMN patient_dni VARCHAR"))
            print("Added patient_dni column")
        except Exception as e:
            print(f"Error adding patient_dni (might exist): {e}")
            
        # Add patient_age
        try:
            conn.execute(text("ALTER TABLE appointments ADD COLUMN patient_age INTEGER"))
            print("Added patient_age column")
        except Exception as e:
            print(f"Error adding patient_age (might exist): {e}")

        conn.commit()

if __name__ == "__main__":
    add_columns()
