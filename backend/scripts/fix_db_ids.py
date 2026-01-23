import sys
import os
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.base import SessionLocal
from app.db.models.preconsultation import PreconsultationQuestion
from sqlalchemy import text

def fix_db_ids():
    db = SessionLocal()
    try:
        # 1. Remove Duplicate Substance Question (Order 61, Select)
        # We keep Order 60 (Boolean)
        dup = db.query(PreconsultationQuestion).filter(PreconsultationQuestion.text.like("%Consumes alguna sustancia%"), PreconsultationQuestion.type == 'select').first()
        if dup:
            print(f"Deleting duplicate question: {dup.id} (Order {dup.order}, Type {dup.type})")
            db.delete(dup)
            db.commit()
        
        # 2. Update IDs to ASK_... format for logic to work
        # Mapping based on Text content
        mapping = [
            ("¿Tus ciclos menstruales son regulares?", "ASK_CYCLES_REGULAR"),
            ("¿Cada cuántos días te viene la regla?", "ASK_CYCLES_FREQUENCY"),
            ("¿Cuántos dias te dura la regla?", "ASK_CYCLES_DURATION"),
            ("¿Consumes alcohol?", "ASK_ALCOHOL"),
            ("¿Consumes alguna sustancia ilicita?", "ASK_SUBSTANCE_USE"),
        ]
        
        for q_text, new_id in mapping:
            q = db.query(PreconsultationQuestion).filter(PreconsultationQuestion.text == q_text).first()
            if q:
                if q.id != new_id:
                    print(f"Updating ID for '{q.text}': {q.id} -> {new_id}")
                    # Updating PK might be tricky in ORM, let's try raw sql if needed, but try ORM first.
                    # Actually, changing PK on an object in session can be issues.
                    # Better to Use a direct UPDATE query.
                    
                    stmt = text("UPDATE preconsultation_questions SET id = :new_id WHERE id = :old_id")
                    db.execute(stmt, {"new_id": new_id, "old_id": q.id})
                    db.commit()
                else:
                    print(f"ID already correct for '{q_text}'")
            else:
                print(f"Question not found: '{q_text}'")

        # 3. Verify Alcohol Options exist
        q_alc = db.query(PreconsultationQuestion).filter(PreconsultationQuestion.id == "ASK_ALCOHOL").first()
        if q_alc:
            if not q_alc.options:
                print("Restoring options for Alcohol...")
                q_alc.options = ['Nunca', 'Ocasional', 'Frecuente']
                db.commit()

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_db_ids()
