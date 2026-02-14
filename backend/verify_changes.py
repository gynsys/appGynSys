"""
Verification script for CycleUser refactor, PushSubscription, and Email Tasks.
Run this script from the backend directory: python verify_changes.py
"""
import sys
import os
import logging
from datetime import date, timedelta
from pydantic import ValidationError

# Force unbuffered output
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

print("Starting verification script...", flush=True)

# Add backend directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
print(f"Added {current_dir} to sys.path", flush=True)

try:
    print("Importing app modules...", flush=True)
    from app.db.base import SessionLocal, Base, engine
    from app.db.models.cycle_user import CycleUser
    from app.db.models.push_subscription import PushSubscription
    from app.schemas.cycle_user import CycleUserCreate, CycleUserUpdate, PushSubscriptionSchema
    from app.tasks.email_tasks import calculate_predictions
    print("Imports successful.", flush=True)
except Exception as e:
    print(f"CRITICAL: Failed to import modules: {e}", flush=True)
    sys.exit(1)

def test_pydantic_schemas():
    print("--- Testing Pydantic Schemas ---", flush=True)
    
    # 1. Valid User
    try:
        user = CycleUserCreate(
            email="test@example.com",
            nombre_completo="Test User",
            password="Password123",
            doctor_slug="mariel-herrera"
        )
        print("✅ Valid CycleUserCreate passed", flush=True)
    except ValidationError as e:
        print(f"❌ Valid CycleUserCreate failed: {e}", flush=True)

    # 2. Invalid Password (too short, no number)
    try:
        CycleUserCreate(
            email="bad@example.com",
            nombre_completo="Bad User",
            password="pwd", # Too short, no number
            doctor_slug="mariel-herrera"
        )
        print("❌ Invalid password check failed (should have raised error)", flush=True)
    except ValidationError:
        print("✅ Invalid password correctly rejected", flush=True)

    # 3. Invalid Slug (uppercase/spaces)
    try:
        CycleUserCreate(
            email="slug@example.com",
            nombre_completo="Slug User",
            password="Password123",
            doctor_slug="Mariel Herrera" # Invalid format
        )
        print("❌ Invalid slug check failed (should have raised error)", flush=True)
    except ValidationError:
        print("✅ Invalid slug correctly rejected", flush=True)
        
    # 4. Push Subscription Schema
    try:
        PushSubscriptionSchema(
            endpoint="https://fcm.googleapis.com/fcm/send/...",
            keys={"p256dh": "key", "auth": "secret"}
        )
        print("✅ Valid PushSubscriptionSchema passed", flush=True)
    except ValidationError as e:
        print(f"❌ Valid PushSubscriptionSchema failed: {e}", flush=True)

    try:
        PushSubscriptionSchema(
            endpoint="http://insecure.com", # HTTP not allowed
            keys={"no_auth": "key"}
        )
        print("❌ Invalid PushSubscription check failed", flush=True)
    except ValidationError:
        print("✅ Invalid PushSubscription correctly rejected", flush=True)


def test_logic_functions():
    print("\n--- Testing Logic Functions ---", flush=True)
    
    # Test calculate_predictions
    last_period = date(2024, 1, 1)
    avg_cycle = 28
    avg_period = 5
    
    preds = calculate_predictions(last_period, avg_cycle, avg_period)
    
    expected_next = date(2024, 1, 29) # 1 + 28
    expected_ovulation = date(2024, 1, 15) # 29 - 14
    expected_fertile_start = date(2024, 1, 10) # 15 - 5
    
    if preds['next_period_start'] == expected_next:
        print(f"✅ Next Period Calculation: {preds['next_period_start']}", flush=True)
    else:
        print(f"❌ Next Period Mismatch: Got {preds['next_period_start']}, expected {expected_next}", flush=True)
        
    if preds['ovulation_date'] == expected_ovulation:
        print(f"✅ Ovulation Calculation: {preds['ovulation_date']}", flush=True)
    else:
        print(f"❌ Ovulation Mismatch: Got {preds['ovulation_date']}, expected {expected_ovulation}", flush=True)

def test_database_models():
    print("\n--- Testing Database Models Metadata ---", flush=True)
    
    print("Checking if PushSubscription is registered in Base...", flush=True)
    if 'push_subscriptions' in Base.metadata.tables:
        print("✅ PushSubscription table found in metadata", flush=True)
    else:
        print("❌ PushSubscription table NOT found in metadata", flush=True)
        
    print("Checking CycleUser constraints in metadata...", flush=True)
    if 'cycle_users' in Base.metadata.tables:
        cycle_user_table = Base.metadata.tables['cycle_users']
        constraints = [c.name for c in cycle_user_table.constraints]
        print(f"Constraints found: {constraints}", flush=True)
        
        # CheckConstraints might be unnamed or named differently by SQLAlchemy depending on definition
        # But we explicitly named them 'check_cycle_length' and 'check_period_length'
        if any('check_cycle_length' in str(c) for c in constraints):
            print("✅ check_cycle_length constraint present", flush=True)
        else:
             print("⚠️ check_cycle_length not explicitly found in constraint names (might be anonymous)", flush=True)
    else:
        print("❌ cycle_users table NOT found in metadata", flush=True)

if __name__ == "__main__":
    try:
        test_pydantic_schemas()
        test_logic_functions()
        test_database_models()
        print("\nVerification Complete.", flush=True)
    except Exception as e:
        print(f"\nCRITICAL ERROR DURING EXECUTION: {e}", flush=True)
