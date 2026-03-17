from app.db.base import SessionLocal
from app.db.models.push_subscription import PushSubscription
from app.services.notifications import create_or_update_subscription
from app.schemas.notification import PushSubscriptionSchema
import json

def test_upsert():
    db = SessionLocal()
    test_token = "TEST_DEVICE_TOKEN_123"
    try:
        # 1. Clean up existing test token
        db.query(PushSubscription).filter(PushSubscription.token == test_token).delete()
        db.commit()
        
        # 2. Simulate Doctor Login
        print("Simulating Doctor Login...")
        sub_doctor = PushSubscriptionSchema(token=test_token)
        create_or_update_subscription(db, sub_doctor, doctor_id=1)
        
        s1 = db.query(PushSubscription).filter_by(token=test_token).first()
        print(f"After Doctor: doctor_id={s1.doctor_id}, user_id={s1.user_id}")
        
        # 3. Simulate Patient Login on SAME DEVICE
        print("Simulating Patient Login on SAME DEVICE...")
        sub_patient = PushSubscriptionSchema(token=test_token)
        create_or_update_subscription(db, sub_patient, user_id=34)
        
        s2 = db.query(PushSubscription).filter_by(token=test_token).first()
        print(f"After Patient: doctor_id={s2.doctor_id}, user_id={s2.user_id}")
        
        if s2.doctor_id == 1 and s2.user_id == 34:
            print("[SUCCESS] Multi-role support verified! Both IDs preserved.")
        else:
            print("[FAIL] One ID was overwritten.")
            
    finally:
        db.close()

if __name__ == "__main__":
    test_upsert()
