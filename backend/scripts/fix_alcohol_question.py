import sys
import os
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.base import SessionLocal
from app.db.models.preconsultation import PreconsultationQuestion

def fix_alcohol_question():
    db = SessionLocal()
    try:
        # Search by text
        q = db.query(PreconsultationQuestion).filter(PreconsultationQuestion.text.like("%Consumes alcohol%")).first()
        if q:
            print(f"Found question: '{q.text}' (Type: {q.type})")
            q.options = ['Nunca', 'Ocasional', 'Frecuente']
            q.type = 'select' # Ensure it is select
            # Optional: Update ID if needed, but risky.
            
            db.commit()
            print("Successfully updated Alcohol question options.")
        else:
            print("Question 'Consumes alcohol' not found.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_alcohol_question()
