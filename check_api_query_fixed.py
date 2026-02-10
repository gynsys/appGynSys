from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser
from app.db.models.notification import PushSubscription
from sqlalchemy import exc

db = SessionLocal()
try:
    print("Attempting FIXED query...")
    # This matches the query we just deployed in push_test.py
    users_data = db.query(
        CycleUser.id, 
        CycleUser.email, 
        CycleUser.nombre_completo
    ).join(PushSubscription).distinct().all()
    
    print(f"API_WOULD_RETURN_COUNT: {len(users_data)}")
    for u in users_data:
        # u is a Row object or named tuple, so access by index or name
        print(f"  - User: {u.email} (ID: {u.id}, Name: {u.nombre_completo})")
        
except exc.SQLAlchemyError as e:
    print(f"SQLALCHEMY ERROR: {e}")
except Exception as e:
    print(f"GENERAL ERROR: {e}")
