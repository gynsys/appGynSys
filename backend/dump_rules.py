import sys
import os
import json
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.db.base import SessionLocal
from app.db.models.notification import NotificationRule

def dump_rules():
    db = SessionLocal()
    try:
        rules = db.query(NotificationRule).all()
        data = []
        for r in rules:
            data.append({
                "id": r.id,
                "tenant_id": r.tenant_id,
                "type": r.notification_type,
                "title": r.title_template,
                "message": r.message_template,
                "is_edited": r.is_edited,
                "updated_at": str(r.updated_at)
            })
        
        with open("all_rules_dump.json", "w", encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"Dumped {len(data)} rules to all_rules_dump.json")
    except Exception as e:
        with open("dump_error.txt", "w") as f:
            f.write(str(e))
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    dump_rules()
