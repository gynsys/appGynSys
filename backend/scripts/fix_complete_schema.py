import sys
from pathlib import Path
from sqlalchemy import text

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.base import SessionLocal, engine

def fix_schema():
    print("Starting Schema Fixes...")
    
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # 1. Fix Doctors Table
            print("Checking 'doctors' table...")
            try:
                conn.execute(text("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR"))
                conn.execute(text("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP"))
                conn.execute(text("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS show_certifications_carousel BOOLEAN DEFAULT FALSE")) # Often missing too based on logs
                print("Added missing columns to 'doctors' (if they were missing).")
            except Exception as e:
                print(f"Error patching doctors: {e}")

            # 2. Fix Preconsultation Questions Table
            print("Checking 'preconsultation_questions' table...")
            try:
                conn.execute(text("ALTER TABLE preconsultation_questions ADD COLUMN IF NOT EXISTS doctor_id INTEGER"))
                # Re-add constraint to be safe (it handles 'already exists' gracefully usually or we catch it)
                try:
                    conn.execute(text("ALTER TABLE preconsultation_questions DROP CONSTRAINT IF EXISTS fk_preconsultation_questions_doctors"))
                    conn.execute(text("ALTER TABLE preconsultation_questions ADD CONSTRAINT fk_preconsultation_questions_doctors FOREIGN KEY (doctor_id) REFERENCES doctors(id)"))
                except Exception as fk_e:
                     print(f"FK Constraint note: {fk_e}")
                
                print("Confirmed 'doctor_id' column on 'preconsultation_questions'.")
            except Exception as e:
                print(f"Error patching preconsultation_questions: {e}")

            trans.commit()
            print("DDL Committed Successfully.")
            
        except Exception as e:
            print(f"DDL Transaction Failed: {e}")
            trans.rollback()
            return

    # 3. Data Migration (Assign Doctor ID)
    # Now that doctors schema is fixed, the ORM query should work
    from app.db.models.doctor import Doctor
    db = SessionLocal()
    try:
        print("Assigning default doctor to questions...")
        first_doc = db.query(Doctor).first()
        if first_doc:
            print(f"Assigning to Doctor ID: {first_doc.id}")
            db.execute(text("UPDATE preconsultation_questions SET doctor_id = :doc_id WHERE doctor_id IS NULL"), {"doc_id": first_doc.id})
            db.commit()
            print("Data Update Successful.")
        else:
            print("WARNING: No doctors found.")
    except Exception as e:
        print(f"Data Update Failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_schema()
