from app.db.base import SessionLocal
from app.db.models.notification import PushSubscription
from app.core.push import send_web_push
import json

db = SessionLocal()
subs = db.query(PushSubscription).all()
print(f'Total subscriptions: {len(subs)}')

for sub in subs:
    print(f'\nTesting subscription for: {sub.user.email}')
    print(f'  User Agent: {sub.user_agent}')
    success, error = send_web_push(
        {'endpoint': sub.endpoint, 'keys': {'p256dh': sub.p256dh, 'auth': sub.auth}},
        json.dumps({'title': 'Test GynSys', 'body': 'Probando notificaciones', 'url': '/dashboard'})
    )
    print(f'  Success: {success}')
    if error:
        print(f'  Error: {error}')
    else:
        print('  ✓ Sent successfully')

print('\nTest completed')
