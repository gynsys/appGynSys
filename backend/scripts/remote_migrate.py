
import sqlite3
import logging
import os
from cryptography.fernet import Fernet
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Logging setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# CONFIGURATION (Prod Environment)
SQLITE_DB_PATH = "/app/temp_migration_backup.db"
POSTGRES_URL = os.getenv("DATABASE_URL", "postgresql://postgres:GynsysDB2026!Secure@db:5432/gynsys")
ENCRYPTION_KEY = b"A8up0W_HbqQ7xs-biRIqLPPAUMZtS1vrQc2QeJ1AhzU="

# Field Mapping: (SQLite Index, Postgres FieldName, IsEncrypted)
MAPPING = [
    (5, "patient_name", True),
    (6, "patient_age", True),
    (7, "patient_ci", True),
    (8, "patient_phone", True),
    (4, "history_number", True),
    (11, "family_history_mother", True),
    (12, "family_history_father", True),
    (13, "personal_history", True),
    (14, "supplements", True),
    (15, "surgical_history", True),
    (61, "reason_for_visit", True),
    (63, "physical_exam", True),
    (64, "ultrasound", True),
    (65, "diagnosis", True),
    (66, "plan", True),
    (67, "observations", True),
    (58, "obstetric_history_summary", True),
    (57, "functional_exam_summary", True),
    (59, "habits_summary", True),
    (69, "created_at", False),
]

def decrypt(value, cipher):
    if not value or not isinstance(value, str) or not value.startswith('gAAAAA'):
        return value
    try:
        return cipher.decrypt(value.encode()).decode()
    except Exception as e:
        return value

def migrate():
    cipher = Fernet(ENCRYPTION_KEY)
    
    if not os.path.exists(SQLITE_DB_PATH):
        logger.error(f"SQLite file not found at {SQLITE_DB_PATH}")
        return

    # 1. Connect to SQLite
    lite_conn = sqlite3.connect(SQLITE_DB_PATH)
    lite_cur = lite_conn.cursor()
    
    # 2. Connect to Postgres
    engine = create_engine(POSTGRES_URL)
    Session = sessionmaker(bind=engine)
    pg_session = Session()
    
    try:
        lite_cur.execute("SELECT * FROM medical_histories WHERE status='completed'")
        rows = lite_cur.fetchall()
        logger.info(f"Found {len(rows)} completed consultations to migrate.")
        
        migrated_count = 0
        for row in rows:
            data = {"doctor_id": 1} 
            
            for index, pg_field, is_encrypted in MAPPING:
                val = row[index]
                if is_encrypted:
                    data[pg_field] = decrypt(val, cipher)
                else:
                    data[pg_field] = val
            
            if data.get("created_at") and isinstance(data["created_at"], str):
                 try:
                     data["created_at"] = datetime.strptime(data["created_at"], "%Y-%m-%d %H:%M:%S.%f")
                 except:
                     pass

            # Check for duplicates
            check_sql = text("SELECT id FROM consultations WHERE patient_ci = :ci AND created_at = :created_at")
            exists = pg_session.execute(check_sql, {"ci": data["patient_ci"], "created_at": data["created_at"]}).fetchone()
            
            if exists:
                logger.info(f"Skipping duplicate: {data['patient_name']} ({data['patient_ci']})")
                continue
            
            fields = ", ".join(data.keys())
            placeholders = ", ".join([f":{k}" for k in data.keys()])
            insert_sql = text(f"INSERT INTO consultations ({fields}) VALUES ({placeholders})")
            
            pg_session.execute(insert_sql, data)
            migrated_count += 1
            
        pg_session.commit()
        logger.info(f"Successfully migrated {migrated_count} records.")
        
    except Exception as e:
        pg_session.rollback()
        logger.error(f"Migration failed: {e}")
    finally:
        lite_conn.close()
        pg_session.close()

if __name__ == "__main__":
    migrate()
