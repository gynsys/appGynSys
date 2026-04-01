from app.db.base import SessionLocal
from app.db.models.campaign import DiffusionCampaign

db = SessionLocal()
try:
    campaigns = db.query(DiffusionCampaign).filter(DiffusionCampaign.status == "sending").all()
    for c in campaigns:
        print(f"Resetting campaign {c.id} to draft...")
        c.status = "draft"
    db.commit()
    print("Reset successful!")
finally:
    db.close()
