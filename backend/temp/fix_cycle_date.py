
import sys
import os
from datetime import date

sys.path.append('/opt/appgynsys/backend')

from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser
from app.db.models.cycle_predictor import CycleLog

def fix_cycle():
    db = SessionLocal()
    try:
        email = "marilouh.mh@gmail.com"
        user = db.query(CycleUser).filter(CycleUser.email == email).first()
        
        if not user:
            print("User not found")
            return

        # Get latest cycle (currently Jan 15)
        last_cycle = db.query(CycleLog).filter(CycleLog.cycle_user_id == user.id)\
            .order_by(CycleLog.start_date.desc()).first()

        if last_cycle:
            print(f"Updating Cycle {last_cycle.id}: {last_cycle.start_date} -> 2026-01-14")
            last_cycle.start_date = date(2026, 1, 14)
            db.commit()
            print("Update successful.")
        else:
            print("No cycle found to update.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_cycle()
