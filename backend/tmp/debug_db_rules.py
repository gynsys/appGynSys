from sqlalchemy import create_url, create_engine, text
import os

# Database connection URL
DATABASE_URL = "postgresql://postgres:gyn13409534@localhost:5433/gynsys"

def check_notification_rules():
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            query = text("SELECT notification_type, channel, title_template FROM notification_rules WHERE notification_type = 'doctor_unified_onboarding'")
            result = conn.execute(query).fetchone()
            
            if result:
                print(f"DEBUG: Found rule '{result[0]}'")
                print(f"DEBUG: Channel: '{result[1]}'")
                print(f"DEBUG: Title: '{result[2]}'")
            else:
                print("DEBUG: Rule 'doctor_unified_onboarding' not found in database.")
                
            # Also check a known dual one for comparison if exists
            query_all = text("SELECT notification_type, channel FROM notification_rules LIMIT 10")
            results_all = conn.execute(query_all).fetchall()
            print("\nDEBUG: First 10 rules for comparison:")
            for r in results_all:
                print(f"- {r[0]}: {r[1]}")
                
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    check_notification_rules()
