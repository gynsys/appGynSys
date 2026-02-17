"""
Seed ALL granular notification rules for all doctors using the centralized seed logic.
"""
import sys
import os

# Add parent directory to sys.path
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.seeds.notification_rules import seed_notification_rules

def run_seed():
    db = SessionLocal()
    try:
        doctors = db.query(Doctor).all()
        print(f"🔄 Re-seeding rules for {len(doctors)} doctors...")
        
        for doctor in doctors:
            print(f"   Seeding rules for: {doctor.slug_url} (ID: {doctor.id})")
            seed_notification_rules(db, doctor.id)
            
        print("\n✅ All granular notification rules (approx 101) have been successfully seeded for all doctors.")
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
