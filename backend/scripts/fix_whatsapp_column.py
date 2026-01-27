import sys
import os
from sqlalchemy import text, create_engine

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def run_migration(uri):
    print(f"Connecting to: {uri}")
    engine = create_engine(uri)
    print("Adding whatsapp_url to doctors table...")
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS whatsapp_url VARCHAR"))
        conn.commit()
    print("Column whatsapp_url added successfully.")

def fix_schema():
    print("Fixing database schema (WhatsApp Column)...")
    
    original_uri = settings.DATABASE_URL
    
    # 1. Try default URI (might fail if 'db' host is not known)
    try:
        print("Attempting connection with default configuration...")
        run_migration(original_uri)
        return
    except Exception as e:
        print(f"Default connection failed: {e}")

    # 2. Try localhost fallback
    print("Attempting fallback to localhost...")
    try:
        if "@db" in str(original_uri):
            # Replace host 'db' with 'localhost'
            new_uri = str(original_uri).replace("@db", "@localhost")
            run_migration(new_uri)
            return
        else:
            print("URI does not contain '@db', skipping localhost replacement.")
    except Exception as e2:
        print(f"Localhost fallback failed: {e2}")
    
    print("Could not apply migration automatically. Please run this script inside the docker container.")

if __name__ == "__main__":
    fix_schema()
