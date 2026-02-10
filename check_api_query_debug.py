from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser
from app.db.models.notification import PushSubscription
from sqlalchemy import exc

db = SessionLocal()
try:
    print("Attempting query...")
    # Trying the exact query again but catching the error to print it fully
    users = db.query(CycleUser).join(PushSubscription).distinct().all()
    print(f"API_WOULD_RETURN_COUNT: {len(users)}")
except exc.SQLAlchemyError as e:
    print(f"SQLALCHEMY ERROR: {e}")
except Exception as e:
    print(f"GENERAL ERROR: {e}")
