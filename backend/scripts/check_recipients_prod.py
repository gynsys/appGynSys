import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:GynsysDB2026!Secure@db:5432/gynsys")

def check_recipients(email_pattern):
    print(f"Searching for {email_pattern} in {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # 1. Check CycleUsers
        res = conn.execute(text(f"SELECT id, email, doctor_id, is_active FROM cycle_users WHERE email ILIKE '%{email_pattern}%'"))
        users = res.fetchall()
        print(f"\nCycleUsers found: {len(users)}")
        for u in users:
            print(f"  - ID: {u.id}, Email: {u.email}, DoctorID: {u.doctor_id}, Active: {u.is_active}")
            
        # 2. Check Patients
        res = conn.execute(text(f"SELECT id, email, doctor_id FROM patients WHERE email ILIKE '%{email_pattern}%'"))
        patients = res.fetchall()
        print(f"\nPatients found: {len(patients)}")
        for p in patients:
            print(f"  - ID: {p.id}, Email: {p.email}, DoctorID: {p.doctor_id}")

        # 3. Check for the current campaign's doctor
        res = conn.execute(text("SELECT id, full_name, slug_url FROM doctors LIMIT 5"))
        doctors = res.fetchall()
        print(f"\nRecent Doctors:")
        for d in doctors:
            print(f"  - ID: {d.id}, Name: {d.full_name}, Slug: {d.slug_url}")

if __name__ == "__main__":
    import sys
    pattern = sys.argv[1] if len(sys.argv) > 1 else "1212pemc"
    check_recipients(pattern)
