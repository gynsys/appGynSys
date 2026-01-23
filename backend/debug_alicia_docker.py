
import sys
import os
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# In docker container, /app is the root, so app module is available directly
# or we just import from app

try:
    from app.core.config import settings
except ImportError:
    # If python path issues, try appending .
    sys.path.append('.')
    from app.core.config import settings

def inspect_alicia():
    # Inside docker, DATABASE_URL should be correct (db:5432)
    db_url = settings.DATABASE_URL
    print(f"Connecting to: {db_url}")
        
    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Search for Alicia
        print("Searching for Alicia...")
        sql = text("SELECT id, patient_name, preconsulta_answers FROM appointments WHERE patient_name ILIKE '%Alicia%' ORDER BY created_at DESC LIMIT 5")
        results = session.execute(sql).fetchall()

        if not results:
            print("No Alicia found. Listing top 5 recent:")
            sql = text("SELECT id, patient_name, created_at FROM appointments ORDER BY created_at DESC LIMIT 5")
            recent = session.execute(sql).fetchall()
            for r in recent:
                print(f"{r.id}: {r.patient_name} ({r.created_at})")
            return

        for result in results:
            print(f"Found Appointment ID: {result.id}")
            print(f"Patient: {result.patient_name}")
            print("-" * 20)
            if result.preconsulta_answers:
                data = json.loads(result.preconsulta_answers)
                print(json.dumps(data, indent=2, ensure_ascii=False))
                
                # Check for birth details specifically
                print("\nChecking birth keys:")
                print("birth_details:", data.get('birth_details'))
                print("ho_table_results:", data.get('ho_table_results'))
            else:
                print("preconsulta_answers is NULL/EMPTY")
            print("=" * 30)

    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    inspect_alicia()
