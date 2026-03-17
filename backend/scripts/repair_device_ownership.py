import sys
import argparse
import json
from app.db.base import SessionLocal
from app.db.models.push_subscription import PushSubscription
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser

def repair_device(token_prefix: str, target_email: str, is_doctor: bool = True):
    db = SessionLocal()
    try:
        # 1. Find the subscription(s) matching the token prefix
        subs = db.query(PushSubscription).filter(PushSubscription.token.like(f"{token_prefix}%")).all()
        if not subs:
            print(f"[FAIL] No subscription found with token prefix: {token_prefix}")
            return

        # 2. Find the target owner
        if is_doctor:
            owner = db.query(Doctor).filter(Doctor.email == target_email).first()
        else:
            owner = db.query(CycleUser).filter(CycleUser.email == target_email).first()

        if not owner:
            print(f"[FAIL] Target {'doctor' if is_doctor else 'patient'} not found: {target_email}")
            return

        # 3. Perform the remap
        for s in subs:
            old_owner = f"Doctor {s.doctor_id}" if s.doctor_id else f"Patient {s.user_id}"
            if is_doctor:
                s.doctor_id = owner.id
                s.user_id = None
            else:
                s.user_id = owner.id
                s.doctor_id = None
            
            print(f"[OK] Subscription {s.id} remapped from {old_owner} to {'Doctor' if is_doctor else 'Patient'} {owner.id} ({target_email})")
        
        db.commit()
        print("[SUCCESS] Device ownership updated successfully.")

    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Repair push subscription ownership conflict.")
    parser.add_argument("--token-prefix", required=True, help="Token prefix (e.g. dvcu7)")
    parser.add_argument("--email", required=True, help="Target email address")
    parser.add_argument("--patient", action="store_true", help="Set as patient owner instead of doctor")
    
    args = parser.parse_args()
    repair_device(args.token_prefix, args.email, is_doctor=not args.patient)
