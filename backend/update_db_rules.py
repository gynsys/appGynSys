import sys
import os

# Ensure backend directory is in path
sys.path.append('c:/Users/pablo/Documents/appgynsys/backend')

from app.core.config import settings
from app.db.base import SessionLocal
from app.db.models.notification import NotificationRule

def update_live_rules():
    db = SessionLocal()
    try:
        # User requested for prenatales and calculadora menstrual
        # We target rules with types starting with 'day_', 'prenatal_', or 'rhythm_'
        rules = db.query(NotificationRule).filter(
            (NotificationRule.notification_type.like('day_%')) | 
            (NotificationRule.notification_type.like('prenatal_%')) |
            (NotificationRule.notification_type.like('rhythm_%')) |
            (NotificationRule.notification_type == 'period_late_1_day')
        ).all()
        
        count = 0
        greeting = "👋 Hola! {patient_name}.\n\n"
        
        for rule in rules:
            updated = False
            
            # Update message_template (HTML)
            if rule.message_template and "👋 Hola!" not in rule.message_template:
                rule.message_template = f"{greeting}{rule.message_template}"
                updated = True
                
            # Update message_text_template (Plain Text)
            if rule.message_text_template and "👋 Hola!" not in rule.message_text_template:
                rule.message_text_template = f"{greeting}{rule.message_text_template}"
                updated = True
                
            if updated:
                count += 1
                
        db.commit()
        print(f"Successfully updated {count} live notification rules in the database.")
    except Exception as e:
        db.rollback()
        print(f"Error updating rules: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    update_live_rules()
