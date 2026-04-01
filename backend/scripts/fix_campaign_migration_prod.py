import os
from sqlalchemy import create_engine, text

# Get DB URL from env or use default for prod container
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:GynsysDB2026!Secure@db:5432/gynsys")

def run_fix():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Cleaning up failed migration attempt...")
        
        # 1. Drop the table if it was partially created
        conn.execute(text("DROP TABLE IF EXISTS diffusion_campaign CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS campaign_contact CASCADE;"))
        
        # 2. Drop columns that might have been added to other tables
        try:
            conn.execute(text("ALTER TABLE pending_notifications DROP COLUMN IF EXISTS recipient_email_direct;"))
            conn.execute(text("ALTER TABLE pending_notifications DROP COLUMN IF EXISTS recipient_name_direct;"))
            conn.execute(text("ALTER TABLE notification_logs DROP COLUMN IF EXISTS recipient_email_direct;"))
            conn.execute(text("ALTER TABLE notification_logs DROP COLUMN IF EXISTS recipient_name_direct;"))
        except Exception as e:
            print(f"Note: Error dropping columns (probably they didn't exist): {e}")

        # 3. Remove the migration record so alembic runs it again
        conn.execute(text("DELETE FROM alembic_version WHERE version_num = 'add_diffusion_campaign_fields';"))
        
        conn.commit()
        print("Cleanup successful!")

if __name__ == "__main__":
    run_fix()
