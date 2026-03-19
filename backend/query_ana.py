import sys
import os
import json

# Add backend to path
sys.path.append(r'c:\Users\pablo\Documents\appgynsys\backend')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models.appointment import Appointment
from app.core.config import settings

# For running inside the container, use the system settings which point to 'db'
db_url = settings.DATABASE_URL

engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    print(f"Searching for patient 'Ana'...")
    # Search for patients whose name contains 'Ana' (case-insensitive)
    anas = db.query(Appointment).filter(Appointment.patient_name.ilike('%Ana%')).all()
    
    if not anas:
        print("No patients found with name containing 'Ana'.")
    else:
        print(f"Found {len(anas)} appointments:")
        for i, app in enumerate(anas):
            print(f"\n--- Appointment {i+1} ---")
            print(f"ID: {app.id}")
            print(f"Name: {app.patient_name}")
            print(f"Date: {app.appointment_date}")
            print(f"Status: {app.status}")
            
            if app.preconsulta_answers:
                try:
                    answers = json.loads(app.preconsulta_answers)
                    print(f"Preconsulta Answers (Keys): {list(answers.keys())}")
                    # Print first 2 answers as sample
                    sample_keys = list(answers.keys())[:5]
                    print("Sample Answers:")
                    for k in sample_keys:
                        print(f"  {k}: {answers[k]}")
                    
                    # Check for habits explicitly
                    habits_keys = ['habits_smoking', 'habits_alcohol', 'habits_physical_activity', 'habits_substance_use', '15', '16', '17', '18']
                    print("Habits check:")
                    for hk in habits_keys:
                        if hk in answers:
                            print(f"  {hk}: {answers[hk]}")
                except Exception as e:
                    print(f"Error parsing JSON answers: {e}")
                    print(f"Raw: {app.preconsulta_answers[:100]}...")
            else:
                print("No preconsulta answers found.")

finally:
    db.close()
