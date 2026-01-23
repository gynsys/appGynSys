import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect

load_dotenv()

def debug_connection():
    url = os.getenv("DATABASE_URL", "Not Set")
    print(f"DEBUG: DATABASE_URL from env starts with: {url[:15]}...")
    
    # Check what SQLALchemy sees
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            print("Successfully connected to DB.")
            inspector = inspect(engine)
            columns = [c['name'] for c in inspector.get_columns('locations')]
            print(f"Columns in 'locations': {columns}")
            
            if 'schedule' in columns:
                print("SUCCESS: 'schedule' column exists.")
            else:
                print("FAILURE: 'schedule' column missing.")
                
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    debug_connection()
