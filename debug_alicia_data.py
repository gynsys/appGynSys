
import sys
import os
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.config import settings

def inspect_alicia():
    # Use DATABASE_URL instead of SQLALCHEMY_DATABASE_URI
    db_url = settings.DATABASE_URL
    # If running locally outside docker, map 'db' host to 'localhost'
    if "@db:" in db_url:
        db_url = db_url.replace("@db:", "@localhost:")
        
    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Find appointment for Alicia Machado
        # We search in appointments table directly
        # Assuming patient_name is stored there
        # List recent appointments to see what names are there
        sql = text("SELECT id, patient_name, appointment_date, preconsulta_answers FROM appointments ORDER BY created_at DESC LIMIT 5")
        results = session.execute(sql).fetchall()

        print(f"Found {len(results)} recent appointments:")
        for res in results:
            print(f"ID: {res.id}, Name: {res.patient_name}, Date: {res.appointment_date}")
            if "Alicia" in str(res.patient_name) or "Machado" in str(res.patient_name):
                print(">>> FOUND MATCH! Dumping answers:")
                if res.preconsulta_answers:
                    data = json.loads(res.preconsulta_answers)
                    print(json.dumps(data, indent=2, ensure_ascii=False))
                else:
                    print("preconsulta_answers is NULL/EMPTY")
                print("-" * 20)

    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    inspect_alicia()
