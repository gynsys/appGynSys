
from app.db.base import SessionLocal, engine
from sqlalchemy import inspect, text

db = SessionLocal()
print(f"DEBUG: Connecting to Database URL: {engine.url}")
try:
    print("Checking ACTUAL Database Table 'preconsultation_questions'...")
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('preconsultation_questions')]
    
    print(f"Columns found: {columns}")
    
    if 'doctor_id' in columns:
        print("SUCCESS: doctor_id column exists in DATABASE.")
    else:
        print("FAILURE: doctor_id column MISSING from DATABASE.")
        
        # Automatic Fix Attempt
        print("Attempting to fix (Running Alembic Upgrade)...")
        import subprocess
        result = subprocess.run(["alembic", "upgrade", "head"], capture_output=True, text=True)
        print(result.stdout)
        print(result.stderr)

except Exception as e:
    print(f"CRITICAL FAILURE: {e}")
finally:
    db.close()
