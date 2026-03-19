
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.db.base import SessionLocal
from app.db.models.preconsultation import PreconsultationQuestion
from app.db.models.doctor import Doctor

def inspect_questions():
    db = SessionLocal()
    try:
        doctors = db.query(Doctor).all()
        for doc in doctors:
            print(f"\n--- Doctor: {doc.nombre_completo} (ID: {doc.id}) ---")
            questions = db.query(PreconsultationQuestion).filter(PreconsultationQuestion.doctor_id == doc.id).all()
            for q in questions:
                if any(k in q.text.lower() for k in ['fuma', 'alcohol', 'ejercicio', 'actividad', 'sustancia', 'droga']):
                    print(f"ID: {q.id} | Text: {q.text[:50]}... | Type: {q.type}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_questions()
