
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import json

DATABASE_URL = "postgresql://postgres:GynsysDB2026!Secure@db:5432/gynsys"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def debug_habits():
    db = SessionLocal()
    try:
        # Get Consultation 41 details
        query_cons = text("SELECT id, patient_name, habits_smoking, habits_alcohol, habits_physical_activity, habits_substance_use FROM consultations WHERE id = 41")
        res_cons = db.execute(query_cons).fetchone()
        
        if res_cons:
            print(f"--- CONSULTATION 41 COLUMNS ---")
            print(f"ID: {res_cons[0]}")
            print(f"Name: {res_cons[1]}")
            print(f"Smoking: {res_cons[2]}")
            print(f"Alcohol: {res_cons[3]}")
            print(f"Activity: {res_cons[4]}")
            print(f"Substances: {res_cons[5]}")
        else:
            print("Consultation 41 NOT FOUND")
            
    finally:
        db.close()

if __name__ == "__main__":
    debug_habits()
