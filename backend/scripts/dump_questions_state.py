import sys
import os
from pathlib import Path
import json

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.base import SessionLocal
from app.db.models.preconsultation import PreconsultationQuestion

def dump_questions():
    db = SessionLocal()
    try:
        questions = db.query(PreconsultationQuestion).order_by(PreconsultationQuestion.order).all()
        print(f"Total Questions: {len(questions)}")
        print("-" * 80)
        print(f"{'Order':<5} | {'ID':<30} | {'Type':<10} | {'Text'}")
        print("-" * 80)
        
        for q in questions:
            print(f"{q.order:<5} | {q.id:<30} | {q.type:<10} | {q.text}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    dump_questions()
