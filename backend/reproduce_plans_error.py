
import sys
import os

# Add the parent directory to sys.path to make the app module importable
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base import SessionLocal
from app.crud.admin import get_plans
from app.schemas.admin import Plan as PlanSchema
from typing import List

def test_fetch_plans():
    db = SessionLocal()
    try:
        print("Fetching plans from DB...")
        plans = get_plans(db, active_only=False)
        print(f"Found {len(plans)} plans.")
        
        print("Validating against Pydantic schema...")
        # validate manually to see if it breaks
        for p in plans:
            print(f"Validating plan: {p.name} (ID: {p.id})")
            # print raw features
            print(f"Raw features type: {type(p.features)}")
            print(f"Raw features: {p.features}")
            
            validated = PlanSchema.model_validate(p)
            print("Validated successfully.")
            
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_fetch_plans()
