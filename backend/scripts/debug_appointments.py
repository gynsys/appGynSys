import sys
import os
from sqlalchemy import create_engine, text

# Using localhost for script execution
DB_URL = "postgresql://postgres:gyn13409534@localhost:5432/gynsys"

def debug_appointments():
    print(f"Connecting to DB: {DB_URL}")
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            print("\n--- LAST 5 APPOINTMENTS ---")
            query = text("""
                SELECT id, patient_name, status, preconsulta_answers, created_at
                FROM appointments 
                ORDER BY id DESC 
                LIMIT 5
            """)
            result = conn.execute(query).fetchall()
            
            for row in result:
                aid, name, status, answers, created = row
                ans_len = len(answers) if answers else "NULL"
                print(f"ID: {aid} | Name: {name} | Status: {status} | Answers: {ans_len}")

    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    debug_appointments()
