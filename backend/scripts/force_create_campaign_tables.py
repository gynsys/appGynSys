import os
from sqlalchemy import create_engine
from app.db.base import Base
# Import models to ensure they are registered with Base
from app.db.models.campaign import DiffusionCampaign, CampaignContact

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:GynsysDB2026!Secure@db:5432/gynsys")

def force_sync():
    print(f"Force syncing schemas to {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL)
    
    # This will create tables that don't exist
    Base.metadata.create_all(bind=engine)
    print("Schemas synced successfully (if they were missing).")

if __name__ == "__main__":
    force_sync()
