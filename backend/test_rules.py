#!/usr/bin/env python3
import sys
sys.path.insert(0, '/opt/appgynsys/backend')

from app.db.base import SessionLocal
from app.crud import crud_notification
import json

db = SessionLocal()
try:
    rules = crud_notification.get_rules_by_tenant(db, 1)
    print(f"Total rules found: {len(rules)}")
    
    if rules:
        print(f"First rule: {rules[0].notification_type}")
        
        # Try to serialize to JSON
        try:
            from app.schemas.notification import NotificationRuleResponse
            serialized = [NotificationRuleResponse.from_orm(rule).dict() for rule in rules[:3]]
            print(f"Serialization successful for first 3 rules")
            print(f"Sample serialized rule keys: {list(serialized[0].keys())}")
        except Exception as e:
            print(f"Serialization ERROR: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("No rules found!")
        
finally:
    db.close()
