import os
import sys

# Add backend to path to import app
sys.path.append(os.path.join(os.getcwd(), "backend"))

from sqlalchemy import text
from app.db.session import get_db_session

def fix_push_schema():
    print("Fixing push_subscriptions schema...")
    with get_db_session() as db:
        try:
            # 1. Ensure token column exists (already done, but double check)
            db.execute(text("ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS token VARCHAR;"))
            
            # 2. Add UNIQUE constraint to 'endpoint' if not already present
            # We can use an index as well for ON CONFLICT
            db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subs_endpoint ON push_subscriptions (endpoint) WHERE endpoint IS NOT NULL;"))
            
            # 3. Add UNIQUE constraint to 'token'
            db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subs_token ON push_subscriptions (token) WHERE token IS NOT NULL;"))
            
            db.commit()
            print("Successfully updated push_subscriptions with UNIQUE indexes for upsert.")
        except Exception as e:
            db.rollback()
            print(f"Error updating schema: {e}")
            sys.exit(1)

if __name__ == "__main__":
    fix_push_schema()
