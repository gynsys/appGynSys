import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:GynsysDB2026!Secure@db:5432/gynsys")

def backfill():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Backfilling campaign_contact from patients and cycle_users...")
        
        # 1. From patients
        # We use INSERT INTO ... SELECT to be fast
        # Only if the email doesn't already exist for that tenant
        conn.execute(text("""
            INSERT INTO campaign_contact (tenant_id, full_name, email, phone, patient_id, source, is_active, created_at)
            SELECT p.doctor_id, p.name, p.email, p.phone, p.id, 'sync_patient', true, now()
            FROM patients p
            WHERE p.email IS NOT NULL AND p.email != ''
            AND NOT EXISTS (
                SELECT 1 FROM campaign_contact cc 
                WHERE cc.email = p.email AND cc.tenant_id = p.doctor_id
            )
        """))
        
        # 2. From cycle_users
        conn.execute(text("""
            INSERT INTO campaign_contact (tenant_id, full_name, email, phone, cycle_user_id, source, is_active, created_at)
            SELECT u.doctor_id, u.nombre_completo, u.email, '', u.id, 'sync_cycle', true, now()
            FROM cycle_users u
            WHERE u.email IS NOT NULL AND u.email != ''
            AND NOT EXISTS (
                SELECT 1 FROM campaign_contact cc 
                WHERE cc.email = u.email AND cc.tenant_id = u.doctor_id
            )
        """))
        
        conn.commit()
        print("Backfill completed successfully!")

if __name__ == "__main__":
    backfill()
