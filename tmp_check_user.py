from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser
import sys

email = sys.argv[1] if len(sys.argv) > 1 else 'proingenioca@gmail.com'
db = SessionLocal()
try:
    user = db.query(CycleUser).filter(CycleUser.email == email).first()
    if user:
        print(f"USER: {user.email}")
        print(f"IS_VERIFIED: {user.is_verified}")
        print(f"TOKEN: {user.verification_token}")
        print(f"IS_ACTIVE: {user.is_active}")
    else:
        print(f"USER NOT FOUND: {email}")
finally:
    db.close()
