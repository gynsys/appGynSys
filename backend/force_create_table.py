import sys
import os

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.base import Base, engine
from app.db.models import endometriosis_result # Ensure model is imported

def force_create_tables():
    print("Force creating missing tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Success: Tables created (if they were missing).")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    force_create_tables()
