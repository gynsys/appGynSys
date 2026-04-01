import os
import json
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:GynsysDB2026!Secure@db:5432/gynsys")

def diag():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # 1. Check Campaigns
        print("\n--- CAMPAIGNS IN ERROR/PENDING ---")
        res = conn.execute(text("SELECT id, title, status, stats, tenant_id FROM diffusion_campaign WHERE status != 'sent' ORDER BY created_at DESC LIMIT 5"))
        campaigns = res.fetchall()
        for c in campaigns:
            print(f"  ID: {c.id}, Title: {c.title}, Status: {c.status}, Stats: {c.stats}, Tenant: {c.tenant_id}")
            
        # 2. Check PendingNotifications count
        print("\n--- PENDING NOTIFICATIONS ---")
        res = conn.execute(text("SELECT status, count(*) FROM pending_notifications GROUP BY status"))
        notifs = res.fetchall()
        for n in notifs:
            print(f"  {n[0]}: {n[1]}")

        # 3. Check for specific campaign 1, etc.
        res = conn.execute(text("SELECT id FROM pending_notifications LIMIT 5"))
        print(f"\nExisten notificaciones pendientes? {res.fetchone() is not None}")
        
if __name__ == "__main__":
    diag()
