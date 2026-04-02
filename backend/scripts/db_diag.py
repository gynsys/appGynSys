from app.db.base import SessionLocal
from app.db.models.campaign import CampaignContact

db = SessionLocal()
count = db.query(CampaignContact).count()
print(f"Total contacts in DB: {count}")

doctor_email = 'milanopabloe@gmail.com'
doctor_contacts = db.query(CampaignContact).filter(CampaignContact.email == doctor_email).all()
print(f"Contacts with doctor email: {len(doctor_contacts)}")

typo_contacts = db.query(CampaignContact).filter(CampaignContact.email.ilike('%unicobn%')).all()
print(f"Contacts with 'unicobn' typo: {len(typo_contacts)}")

db.close()
