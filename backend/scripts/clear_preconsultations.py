import sys
from sqlalchemy import create_engine, text

# Using localhost for script execution
DB_URL = "postgresql://postgres:gyn13409534@localhost:5432/gynsys"

def clear_preconsultations():
    print(f"Connecting to DB: {DB_URL}")
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            # Check count before
            count_query = text("SELECT COUNT(*) FROM appointments WHERE preconsulta_answers IS NOT NULL")
            before_count = conn.execute(count_query).scalar()
            print(f"Found {before_count} appointments with preconsultation answers.")

            if before_count > 0:
                print("Clearing preconsultation data...")
                # Update query
                update_query = text("UPDATE appointments SET preconsulta_answers = NULL, status = 'confirmed' WHERE preconsulta_answers IS NOT NULL")
                conn.execute(update_query)
                conn.commit()
                print("Successfully cleared preconsultation answers and reset status to 'confirmed'.")
            else:
                print("No data to clear.")
                
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    clear_preconsultations()
