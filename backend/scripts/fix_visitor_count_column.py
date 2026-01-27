import sys
import os
from sqlalchemy import text, create_engine

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def run_migration(uri):
    print(f"Connecting to: {uri}")
    engine = create_engine(uri)
    print("Adding visitor_count to doctors table...")
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS visitor_count INTEGER DEFAULT 0 NOT NULL"))
        conn.commit()
    print("Column visitor_count added successfully.")

def fix_schema():
    print("Fixing database schema (Visitor Count)...")
    
    original_uri = settings.DATABASE_URL
    
    # 1. Try default URI
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
            new_uri = str(original_uri).replace("@db", "@localhost")
            run_migration(new_uri)
            return
    except Exception as e2:
        print(f"Localhost fallback failed: {e2}")
    
    print("Could not apply migration automatically. Please run this script inside the docker container.")

if __name__ == "__main__":
    fix_schema()
