import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.config import settings
from app.db.session import SessionLocal

def list_modules():
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT id, name, code, is_active FROM modules"))
        modules = result.fetchall()
        print("\nExisting Modules:")
        print("-" * 50)
        print(f"{'ID':<5} {'Name':<30} {'Code':<20} {'Active'}")
        print("-" * 50)
        for m in modules:
            print(f"{m.id:<5} {m.name:<30} {m.code:<20} {m.is_active}")
        print("-" * 50)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_modules()
