
import sys
import os
from sqlalchemy import create_engine, text

# Use env var if available (Docker), else localhost fallback
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:gyn13409534@localhost:5432/gynsys")

def find_malta():
    print("--- Searching for 'Malta' or 'Perez' in Appointments ---")
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            # Search in patient_name
            query = text("SELECT id, patient_name, status, updated_at FROM appointments WHERE patient_name ILIKE :term")
            results = conn.execute(query, {"term": "%Malta%"}).fetchall()
            
            if results:
                print(f"✅ Found {len(results)} matches for 'Malta':")
                for r in results:
                    print(f"   ID: {r[0]} | Name: {r[1]} | Status: {r[2]} | Updated: {r[3]}")
            else:
                print("❌ No matches for 'Malta' in patient_name.")

            # List top 5 recent appointments just in case
            print("\n--- Last 5 Appointments ---")
            query_recent = text("SELECT id, patient_name, status, updated_at FROM appointments ORDER BY id DESC LIMIT 5")
            recents = conn.execute(query_recent).fetchall()
            for r in recents:
                print(f"   ID: {r[0]} | Name: {r[1]} | Status: {r[2]}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    find_malta()
