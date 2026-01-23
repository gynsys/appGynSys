
import sys
import os
from sqlalchemy import create_engine, text

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:gyn13409534@localhost:5432/gynsys")

def list_questions():
    print("--- Listing All Preconsultation Questions ---")
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            # Query all questions
            query = text("SELECT id, text, category FROM preconsultation_questions ORDER BY id")
            results = conn.execute(query).fetchall()
            
            for r in results:
                text_lower = r[1].lower()
                # Print ID, Category, and Text
                # Filter for identifying the correct "Reason" and "Fertility" questions
                keywords = ["motivo", "consulta", "razón", "razon", "deseo", "hijos", "embarazo", "fertilidad", "objetivo"]
                
                if any(k in text_lower for k in keywords):
                     print(f"MATCH ID: {r[0]} | Cat: {r[2]} | Text: {r[1]}")
                
                 # Also print ID 57 to confirm context
                if str(r[0]).endswith("_57"):
                     print(f"CTX ID: {r[0]} | Cat: {r[2]} | Text: {r[1]}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_questions()
