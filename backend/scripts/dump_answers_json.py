
import sys
import os
import json
from sqlalchemy import create_engine, text

# DB Connection
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:gyn13409534@localhost:5432/gynsys")

def dump_answers(appointment_id):
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            # Query the JSON answers column directly
            sql = text("SELECT preconsulta_answers FROM appointments WHERE id = :aid")
            result = conn.execute(sql, {"aid": appointment_id}).fetchone()
            
            if not result:
                print(json.dumps({"error": "Appointment not found"}))
                return
                
            answers_json = result[0]
            
            # If it's a string, load it. If it's already list/dict (psycopg2 adapter), use as is.
            if isinstance(answers_json, str):
                 answers_data = json.loads(answers_json)
            else:
                 answers_data = answers_json

            # Print neatly
            print(json.dumps(answers_data, indent=2, ensure_ascii=False))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        appt_id = int(sys.argv[1])
    else:
        appt_id = 7 # Default to Malta Perez
    dump_answers(appt_id)
