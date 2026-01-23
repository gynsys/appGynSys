from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser

db = SessionLocal()
print("--- Deleting User ---")
try:
    emails_to_delete = ["milanopabloe@gmail.com", "dramarielh@gmail.com"]
    for email in emails_to_delete:
        user = db.query(CycleUser).filter(CycleUser.email == email).first()
        if user:
            db.delete(user)
            db.commit()
            print(f"Deleted user: {email}")
        else:
            print(f"User not found: {email}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
