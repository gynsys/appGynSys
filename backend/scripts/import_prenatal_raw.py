
"""
Import raw prenatal rules from JSON to DB for UI review.
"""
import sys
import os
import json

# Add backend directory to path so we can import app modules
# Assumes this script is in backend/scripts/
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.orm import Session
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.notification import NotificationRule, NotificationType, NotificationChannel

# JSON file path (relative to this script)
JSON_PATH = os.path.join(os.path.dirname(__file__), 'prenatal.json')

def import_rules():
    if not os.path.exists(JSON_PATH):
        print(f"❌ Error: File not found at {JSON_PATH}")
        return

    print(f"Reading {JSON_PATH}...")
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    db = SessionLocal()
    try:
        doctors = db.query(Doctor).all()
        print(f"Found {len(doctors)} doctors. Importing {len(data)} rules for each...")

        for doctor in doctors:
            print(f"  Processing for doctor: {doctor.slug_url}")
            
            # Get existing rules to avoid duplicates (by name)
            existing_rules = db.query(NotificationRule).filter(
                NotificationRule.tenant_id == doctor.id
            ).all()
            existing_names = {r.name for r in existing_rules}
            
            rules_created = 0
            
            for item in data:
                # Map JSON fields to DB fields
                
                # 1. Determine Type
                category = item.get("categoria")
                notif_type = NotificationType.CUSTOM
                
                if category == "estudio" or category == "hito":
                    notif_type = "prenatal_milestone" # Using string to match DB enum
                elif category == "consejo_diario":
                    notif_type = "prenatal_daily" # New type we added to frontend
                elif category == "alerta":
                    notif_type = "prenatal_alert" # New type we added to frontend
                
                # 2. Build Trigger (Raw JSON copy for now)
                # We save the WHOLE item payload as trigger so we don't lose data
                # The backend evaluate_rule will eventually need to parse this.
                trigger = item.copy()
                # Remove display fields from trigger to save space? Nah, keep it all for context.
                
                # 3. Construct Name
                # Prefix with category for easier sorting in UI
                name = f"Prenatal - {item['titulo']}"
                
                if name in existing_names:
                    # Skip or Update? User wants to list them to delete them. 
                    # If it exists, let's skip for now to avoid overwriting manual edits?
                    # actually, let's skip.
                    continue

                # 4. Channel
                # Default to PUSH for daily tips, DUAL for milestones/alerts
                channel = "push"
                if item.get("etiqueta") == "DUAL" or category == "alerta":
                    channel = "dual"
                
                # 5. Create Rule
                rule = NotificationRule(
                    tenant_id=doctor.id,
                    name=name,
                    notification_type=notif_type,
                    trigger_condition=trigger, # Storing the RAW JSON criteria
                    channel=channel,
                    message_template=f"<h1>{item['titulo']}</h1><p>{item['mensaje']}</p>",
                    is_active=True # Default to active so they show up
                )
                db.add(rule)
                rules_created += 1
            
            print(f"    - Created {rules_created} new rules.")
            
        db.commit()
        print("\n✅ Import successful!")
        
    except Exception as e:
        print(f"❌ Error importing rules: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_rules()
