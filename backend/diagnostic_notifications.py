"""
Diagnostic script to identify notification loading issues.
Run inside Docker: docker compose exec backend python diagnostic_notifications.py
"""
import sys
import traceback

print("=" * 60)
print("NOTIFICATION DIAGNOSTIC SCRIPT")
print("=" * 60)

# Step 1: Test imports
print("\n[1] Testing imports...")
try:
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker
    print("    ✅ SQLAlchemy imported")
except Exception as e:
    print(f"    ❌ SQLAlchemy import failed: {e}")
    sys.exit(1)

try:
    from app.db.models.notification import NotificationRule, NotificationType, NotificationChannel
    print("    ✅ NotificationRule model imported")
    print(f"    📋 NotificationType values: {[e.value for e in NotificationType]}")
    print(f"    📋 NotificationChannel values: {[e.value for e in NotificationChannel]}")
except Exception as e:
    print(f"    ❌ Model import failed: {e}")
    traceback.print_exc()
    sys.exit(1)

# Step 2: Test database connection
print("\n[2] Testing database connection...")
import os
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:gyn13409534@db:5432/gynsys")
print(f"    Using: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    result = session.execute(text("SELECT 1"))
    print("    ✅ Database connection successful")
except Exception as e:
    print(f"    ❌ Database connection failed: {e}")
    traceback.print_exc()
    sys.exit(1)

# Step 3: Check raw data in database
print("\n[3] Checking raw notification data...")
try:
    result = session.execute(text("""
        SELECT id, name, notification_type, channel, tenant_id 
        FROM notification_rules 
        ORDER BY id
    """))
    rows = result.fetchall()
    print(f"    Found {len(rows)} rules in database:")
    for row in rows:
        print(f"    - ID:{row[0]} | Type:{row[2]} | Channel:{row[3]} | Tenant:{row[4]} | Name:{row[1][:30]}")
except Exception as e:
    print(f"    ❌ Raw query failed: {e}")
    traceback.print_exc()

# Step 4: Test ORM query (this is where the error likely occurs)
print("\n[4] Testing ORM query (NotificationRule model)...")
try:
    rules = session.query(NotificationRule).all()
    print(f"    ✅ ORM query successful! Found {len(rules)} rules")
    for rule in rules[:5]:  # Show first 5
        print(f"    - {rule.name}: type={rule.notification_type}, channel={rule.channel}")
except Exception as e:
    print(f"    ❌ ORM query failed: {e}")
    traceback.print_exc()

# Step 5: Test with tenant filter
print("\n[5] Testing ORM query with tenant filter...")
try:
    tenant_id = 1  # mariel-herrera
    rules = session.query(NotificationRule).filter(NotificationRule.tenant_id == tenant_id).all()
    print(f"    ✅ Found {len(rules)} rules for tenant_id={tenant_id}")
except Exception as e:
    print(f"    ❌ Tenant filter query failed: {e}")
    traceback.print_exc()

# Step 6: Check if enum values match
print("\n[6] Checking enum value compatibility...")
try:
    result = session.execute(text("SELECT DISTINCT notification_type FROM notification_rules"))
    db_types = [row[0] for row in result.fetchall()]
    python_types = [e.value for e in NotificationType]
    
    print(f"    Database types: {db_types}")
    print(f"    Python enum values: {python_types}")
    
    missing = [t for t in db_types if t not in python_types]
    if missing:
        print(f"    ❌ MISSING IN PYTHON ENUM: {missing}")
    else:
        print("    ✅ All DB types exist in Python enum")
        
except Exception as e:
    print(f"    ❌ Enum check failed: {e}")
    traceback.print_exc()

# Step 7: Check channel enum
print("\n[7] Checking channel enum compatibility...")
try:
    result = session.execute(text("SELECT DISTINCT channel FROM notification_rules"))
    db_channels = [row[0] for row in result.fetchall()]
    python_channels = [e.value for e in NotificationChannel]
    
    print(f"    Database channels: {db_channels}")
    print(f"    Python enum values: {python_channels}")
    
    missing = [c for c in db_channels if c not in python_channels]
    if missing:
        print(f"    ❌ MISSING IN PYTHON ENUM: {missing}")
    else:
        print("    ✅ All DB channels exist in Python enum")
        
except Exception as e:
    print(f"    ❌ Channel check failed: {e}")
    traceback.print_exc()

# Step 8: Test API endpoint simulation
print("\n[8] Testing CRUD function...")
try:
    from app.crud import crud_notification
    rules = crud_notification.get_rules_by_tenant(session, tenant_id=1)
    print(f"    ✅ CRUD function returned {len(rules)} rules")
except Exception as e:
    print(f"    ❌ CRUD function failed: {e}")
    traceback.print_exc()

print("\n" + "=" * 60)
print("DIAGNOSTIC COMPLETE")
print("=" * 60)

session.close()
