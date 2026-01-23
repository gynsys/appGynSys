
import sys
import os
from sqlalchemy import create_engine, text

# Add backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.core.config import settings

# Use settings URL or fallback
DB_URL = os.getenv("DATABASE_URL", settings.DATABASE_URL)
engine = create_engine(DB_URL)

def list_preconsultas():
    print(f"Connecting to DB: {DB_URL}")
    with engine.connect() as conn:
        try:
            query = text("""
                SELECT id, patient_name, appointment_date, status, preconsulta_answers 
                FROM appointments 
                ORDER BY updated_at DESC LIMIT 20
            """)
            result = conn.execute(query)
            rows = result.fetchall()
            
            if not rows:
                print("No appointments found in TABLE 'appointments'. (DB might be empty)")
            else:
                print(f"Found {len(rows)} appointments (Checking preconsulta_answers):")
                print(f"{'ID':<5} | {'Date':<15} | {'Patient Name':<20} | {'Status':<10} | {'Answers?'}")
                print("-" * 75)
                for row in rows:
                    date_str = str(row[2])[:10] if row[2] else "N/A"
                    has_ans = "YES" if row[4] else "NO"
                    print(f"{row[0]:<5} | {date_str:<15} | {row[1]:<20} | {row[3]:<10} | {has_ans}")
        except Exception as e:
            print(f"Error querying DB: {e}")

if __name__ == "__main__":
    list_preconsultas()
