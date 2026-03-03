import json
from datetime import datetime, timedelta
import pytz
from app.db.base import SessionLocal
from app.db.models.notification import PendingNotification, NotificationLog
from app.services.notifications.base import normalize_to_caracas

db = SessionLocal()
try:
    now = normalize_to_caracas()
    yesterday = now - timedelta(days=1)
    
    print(f"DEBUG TIME:")
    print(f"  Now (Caracas): {now}")
    print(f"  Yesterday (Caracas): {yesterday}")
    
    # Query SQLAlchemy
    sent_last_24h_sq = db.query(NotificationLog).filter(NotificationLog.sent_at >= yesterday).count()
    
    # Query SQL Directa con NOW() de Postgres
    from sqlalchemy import text
    result = db.execute(text("SELECT count(*) FROM notification_logs WHERE sent_at >= NOW() - INTERVAL '24 hours'"))
    sent_last_24h_sql = list(result)[0][0]
    
    print(f"\nMETRICAS DE SALUD:")
    print(f"  Enviadas 24h (SQLAlchemy/health.py): {sent_last_24h_sq}")
    print(f"  Enviadas 24h (SQL Directo/Postgres): {sent_last_24h_sql}")
    
    # Ver muestras de logs
    logs = db.query(NotificationLog).order_by(NotificationLog.sent_at.desc()).limit(5).all()
    print("\nULTIMOS LOGS:")
    for l in logs:
        print(f"  ID:{l.id} sent_at:{l.sent_at} (tzinfo:{l.sent_at.tzinfo})")

except Exception as e:
    print(f"ERROR: {e}")
finally:
    db.close()
