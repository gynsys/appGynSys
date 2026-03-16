import psycopg2
import os
import sys
from pathlib import Path

# Add backend to path to import settings
backend_path = Path(__file__).parent.parent
sys.path.append(str(backend_path))

try:
    from app.core.config import settings
except ImportError:
    print("Could not import settings. Fallback to env.")
    class Settings:
        DATABASE_URL = os.getenv("DATABASE_URL")
    settings = Settings()

def list_doctors():
    url = settings.DATABASE_URL
    if not url:
        print("DATABASE_URL not set.")
        return

    try:
        conn = psycopg2.connect(url)
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, nombre_completo, email, slug_url FROM doctors")
        doctors = cursor.fetchall()
        print(f"Doctors found: {len(doctors)}")
        for d in doctors:
            print(f"ID: {d[0]} | Name: {d[1]} | Email: {d[2]} | Slug: {d[3]}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_doctors()
