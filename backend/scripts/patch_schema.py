from sqlalchemy import create_engine, text
import os

db_url = os.environ.get("DATABASE_URL", "postgresql://postgres:gyn13409534@127.0.0.1:5433/gynsys")
engine = create_engine(db_url)

sql = """
-- 1. Make tenant_id nullable for global rules
ALTER TABLE notification_rules ALTER COLUMN tenant_id DROP NOT NULL;

-- 2. Ensure other columns are present (idempotent)
ALTER TABLE notification_rules ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 50;
ALTER TABLE notification_rules ADD COLUMN IF NOT EXISTS title_template VARCHAR(255);
ALTER TABLE notification_rules ADD COLUMN IF NOT EXISTS message_text_template TEXT;
ALTER TABLE notification_rules ADD COLUMN IF NOT EXISTS send_time VARCHAR(10) DEFAULT '08:00';
ALTER TABLE notification_rules ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;

-- 3. Cleanup: If 'name' column exists, populate 'title_template' from it then drop 'name'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notification_rules' AND column_name='name') THEN
        UPDATE notification_rules SET title_template = name WHERE title_template IS NULL;
        ALTER TABLE notification_rules DROP COLUMN name;
    END IF;
END $$;
"""

with engine.connect() as con:
    con.execute(text(sql))
    con.commit()
    print("Schema patched successfully (tenant_id is now nullable).")
con.close()
