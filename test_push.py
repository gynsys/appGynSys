from app.db.base import SessionLocal
from app.db.models.push_subscription import PushSubscription
from app.services.push_service import send_push_notification
from app.db.models.cycle_user import CycleUser
import json

db = SessionLocal()
subs = db.query(PushSubscription).all()
print(f'Total subscriptions: {len(subs)}')

for sub in subs:
    user = sub.user or sub.doctor
    if not user:
        continue
    print(f'\nTesting subscription for: {user.email}')
    result = send_push_notification(
        user=user,
        title='Test GynSys',
        body='Probando notificaciones',
        data={'url': '/dashboard'}
    )
    print(f"  Result: {result}")

print('\nTest completed')
