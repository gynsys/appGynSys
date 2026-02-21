from app.db.session import SessionLocal
from app.db.models.cycle_user import CycleUser
from app.db.models.notification import PendingNotification, NotificationLog
from app.db.models.cycle_predictor import CycleNotificationSettings
from datetime import datetime, timedelta
import pytz

def debug_full():
    db = SessionLocal()
    caracas_tz = pytz.timezone('America/Caracas')
    now_caracas = datetime.now(caracas_tz)
    print(f'--- CURRENT SERVER TIME (Caracas): {now_caracas} ---')
    print(f'--- CURRENT SERVER TIME (UTC): {datetime.utcnow()} ---')
    
    try:
        user = db.query(CycleUser).filter(CycleUser.email == 'dramarielh@gmail.com').first()
        if not user:
            print('User dramarielh@gmail.com not found')
            return
        
        print(f'User ID: {user.id}')
        
        settings = db.query(CycleNotificationSettings).filter(CycleNotificationSettings.cycle_user_id == user.id).first()
        if settings:
            print(f'Contraceptive Enabled: {settings.contraceptive_enabled}')
            print(f'Contraceptive Time (Settings): {settings.contraceptive_time}')
        else:
            print('No notification settings found for user')

        print('\n--- PENDING NOTIFICATIONS (Recent) ---')
        # Check for notifications scheduled for today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        pending = db.query(PendingNotification).filter(
            PendingNotification.recipient_id == user.id,
            PendingNotification.scheduled_for >= today_start
        ).order_by(PendingNotification.scheduled_for.desc()).all()
        
        if not pending:
            print('No pending notifications found for today.')
        
        for p in pending:
            print(f'ID: {p.id}, Status: {p.status}, Subject: {p.subject}, Scheduled (UTC): {p.scheduled_for}')
            if p.last_error:
                print(f'   Last Error: {p.last_error}')

        print('\n--- RECENT SENT LOGS (Last 24h) ---')
        logs = db.query(NotificationLog).filter(
            NotificationLog.recipient_id == user.id, 
            NotificationLog.sent_at >= datetime.utcnow() - timedelta(days=1)
        ).all()
        
        if not logs:
            print('No logs found for the last 24h.')
            
        for l in logs:
            print(f'Sent At (UTC): {l.sent_at}, Status: {l.status}, Title: {l.title_sent}, Channel: {l.channel_used}')

    finally:
        db.close()

if __name__ == "__main__":
    debug_full()
