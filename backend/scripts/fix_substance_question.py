import sys
import os
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.base import SessionLocal
from app.db.models.preconsultation import PreconsultationQuestion

def fix_substance_question():
    db = SessionLocal()
    try:
        # Search by text since ID might be old or different
        q = db.query(PreconsultationQuestion).filter(PreconsultationQuestion.text.like("%Consumes alguna sustancia%")).first()
        if q:
            print(f"Found question: '{q.text}' with ID: {q.id} (Type: {q.type})")
            q.type = "boolean"
            q.options = None # Clear options as boolean doesn't need them
            # Also update the ID to the standard one if it's different, to standardize future lookups
            if q.id != "ASK_SUBSTANCE_USE":
                print(f"Updating ID from {q.id} to ASK_SUBSTANCE_USE")
                # Need to be careful updating PK. Standard SQLAlchemy often blocks this or it might cascade.
                # For now, let's just update the type. Changing PK is risky if referenced.
                # q.id = "ASK_SUBSTANCE_USE" 
            
            db.commit()
            print("Successfully updated type to 'boolean'.")
        else:
            print("Question with text 'Consumes alguna sustancia' not found.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_substance_question()
