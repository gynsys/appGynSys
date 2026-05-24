import sys
import os
sys.path.insert(0, '/app')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import SessionLocal
from app.db.models.consultation import Consultation

def main():
    db = SessionLocal()
    try:
        res = db.query(Consultation).filter(Consultation.patient_name.ilike('%adis%')).all()
        print(f"Found {len(res)} matches for 'adis':")
        for r in res:
            print(f"ID: {r.id}")
            print(f"  Name: {r.patient_name}")
            print(f"  CI: {r.patient_ci}")
            print(f"  Family History: {r.family_history_mother}")
            print(f"  Observations (weight): {r.observations}")
            print(f"  Doctor ID: {r.doctor_id}")
            print(f"  Date: {r.created_at}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    main()
