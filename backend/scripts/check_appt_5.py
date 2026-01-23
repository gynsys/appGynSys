
import sys
import os
from sqlalchemy import create_engine, text

# DB Connection
DB_URL = "postgresql://postgres:gyn13409534@localhost:5432/gynsys"

def check_appt(appt_id):
    print(f"Checking Appointment ID: {appt_id}")
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            # Check Appointment
            query = text("SELECT id, doctor_id, patient_name, status FROM appointments WHERE id = :id")
            result = conn.execute(query, {"id": appt_id}).fetchone()
            
            if not result:
                print(f"❌ Appointment {appt_id} NOT FOUND in database.")
                return

            print(f"✅ Appointment {appt_id} FOUND.")
            print(f"   Patient: {result[2]}")
            print(f"   Status: {result[3]}")
            print(f"   Doctor ID: {result[1]}")
            
            # Check Doctor
            doc_id = result[1]
            if doc_id:
                doc_query = text("SELECT id, email, full_name FROM users WHERE id = :id AND role = 'doctor'") 
                # Note: 'doctors' table might be separate or linked to users. 
                # Assuming 'doctors' table based on code: db.query(Doctor)
                # Let's check 'doctors' table first.
                try:
                    doc_res = conn.execute(text("SELECT id FROM doctors WHERE id = :id"), {"id": doc_id}).fetchone()
                    if doc_res:
                         print(f"✅ Doctor {doc_id} FOUND in 'doctors' table.")
                    else:
                         print(f"❌ Doctor {doc_id} NOT FOUND in 'doctors' table.")
                except Exception:
                    # Fallback if table name is different
                    print("Could not query 'doctors' table directly.")
            else:
                print(f"❌ Appointment has NO doctor_id.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_appt(5)
