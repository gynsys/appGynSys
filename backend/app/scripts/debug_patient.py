from app.db.base import SessionLocal
from app.db.models.consultation import Consultation
import sys

def main():
    db = SessionLocal()
    try:
        search = "Prueba Lunes"
        results = db.query(Consultation).filter(Consultation.patient_name.ilike(f"%{search}%")).all()
        print(f"Found {len(results)} consultations for '{search}'")
        for c in results:
            print(f"ID: {c.id} | Date: {c.created_at} | CI: {c.patient_ci} | Diag: {c.diagnosis[:50]}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
