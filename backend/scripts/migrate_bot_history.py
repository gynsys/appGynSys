
import sqlite3
import logging
from cryptography.fernet import Fernet
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Logging setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# CONFIGURATION
SQLITE_DB_PATH = r"d:\gynsys\backup-medical_bot-2026-03-25_133000.db"
POSTGRES_URL = "postgresql://postgres:gyn13409534@127.0.0.1:5433/gynsys"
ENCRYPTION_KEY = b"A8up0W_HbqQ7xs-biRIqLPPAUMZtS1vrQc2QeJ1AhzU="

# Field Mapping: (SQLite Index, Postgres FieldName, IsEncrypted)
# Based on PRAGMA table_info(medical_histories)
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
        logger.warning(f"Failed to decrypt value: {value[:20]}... Error: {e}")
        return value

def migrate():
    cipher = Fernet(ENCRYPTION_KEY)
    
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
            # Prepare Postgres Data
            data = {"doctor_id": 1} # Default to first doctor
            
            for index, pg_field, is_encrypted in MAPPING:
                val = row[index]
                if is_encrypted:
                    data[pg_field] = decrypt(val, cipher)
                else:
                    data[pg_field] = val
            
            # Additional cleanup/formatting
            if data.get("created_at") and isinstance(data["created_at"], str):
                 try:
                     # SQLite timestamp: 2026-01-05 16:54:25.555712
                     data["created_at"] = datetime.strptime(data["created_at"], "%Y-%m-%d %H:%M:%S.%f")
                 except:
                     pass

            # Check for duplicates (same CI and created_at)
            check_sql = text("SELECT id FROM consultations WHERE patient_ci = :ci AND created_at = :created_at")
            exists = pg_session.execute(check_sql, {"ci": data["patient_ci"], "created_at": data["created_at"]}).fetchone()
            
            if exists:
                logger.info(f"Skipping duplicate: {data['patient_name']} ({data['patient_ci']}) at {data['created_at']}")
                continue
            
            # Insert into Postgres
            fields = ", ".join(data.keys())
            placeholders = ", ".join([f":{k}" for k in data.keys()])
            insert_sql = text(f"INSERT INTO consultations ({fields}) VALUES ({placeholders})")
            
            pg_session.execute(insert_sql, data)
            migrated_count += 1
            
        pg_session.commit()
        logger.info(f"Successfully migrated {migrated_count} records.")
        
    except Exception as e:
        pg_session.rollback()
        logger.error(f"Migration failed: {e}", exc_info=True)
    finally:
        lite_conn.close()
        pg_session.close()

if __name__ == "__main__":
    migrate()
