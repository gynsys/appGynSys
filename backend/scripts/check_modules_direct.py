import sys
from sqlalchemy import create_engine, text

# Database URL from config.py
DATABASE_URL = "postgresql://postgres:gyn13409534@localhost:5432/gynsys"

def list_modules():
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            result = connection.execute(text("SELECT id, name, code, is_active FROM modules"))
            modules = result.fetchall()
            print("\nExisting Modules:")
            print("-" * 50)
            print(f"{'ID':<5} {'Name':<30} {'Code':<20} {'Active'}")
            print("-" * 50)
            for m in modules:
                print(f"{m[0]:<5} {m[1]:<30} {m[2]:<20} {m[3]}")
            print("-" * 50)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_modules()
