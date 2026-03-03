from sqlalchemy.orm import Session
import re
from app.db.session import get_db_session
from app.db.models.notification import NotificationRule
from app.core.logging import logger

def clean_html(raw_html: str) -> str:
    """Removes HTML tags and normalizes whitespace."""
    if not raw_html:
        return ""
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext.strip()

def patch_notifications():
    """
    Syncs message_text_template with message_template for all rules
    where they differ significantly or text is too short.
    """
    with get_db_session() as db:
        rules = db.query(NotificationRule).all()
        updated_count = 0
        
        print(f"Checking {len(rules)} rules...")
        
        for rule in rules:
            if not rule.message_template:
                continue
                
            expected_text = clean_html(rule.message_template)
            current_text = rule.message_text_template or ""
            
            # Update if empty, or if significantly shorter than expected
            if not current_text or len(current_text) < len(expected_text) * 0.8:
                print(f"Updating [{rule.notification_type}]:")
                print(f"  Old: {current_text}")
                print(f"  New: {expected_text}")
                
                rule.message_text_template = expected_text
                updated_count += 1
        
        if updated_count > 0:
            db.commit()
            print(f"\nSuccessfully patched {updated_count} notification rules in database.")
        else:
            print("\nNo rules needed patching.")

if __name__ == "__main__":
    patch_notifications()
