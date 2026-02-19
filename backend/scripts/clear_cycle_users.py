import sys
import os

# Añadir el directorio raíz del backend al path para que funcionen los imports de app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser
from app.db.models.cycle_predictor import CycleLog, SymptomLog, CycleNotificationSettings, PregnancyLog
from app.db.models.push_subscription import PushSubscription
from app.db.models.notification import PendingNotification, NotificationLog

def clear_all():
    db = SessionLocal()
    try:
        print("--- Iniciando limpieza de datos de Mi Ciclo ---")
        
        # 1. Pregnancy Logs
        num = db.query(PregnancyLog).delete()
        print(f"Eliminados {num} registros de PregnancyLog")
        
        # 2. Symptom Logs
        num = db.query(SymptomLog).delete()
        print(f"Eliminados {num} registros de SymptomLog")
        
        # 3. Cycle Logs
        num = db.query(CycleLog).delete()
        print(f"Eliminados {num} registros de CycleLog")
        
        # 4. Notification Settings
        num = db.query(CycleNotificationSettings).delete()
        print(f"Eliminados {num} registros de CycleNotificationSettings")
        
        # 5. Push Subscriptions
        num = db.query(PushSubscription).delete()
        print(f"Eliminados {num} registros de PushSubscription")
        
        # 6. Pending Notifications
        num = db.query(PendingNotification).delete()
        print(f"Eliminados {num} registros de PendingNotification")
        
        # 7. Notification Logs
        num = db.query(NotificationLog).delete()
        print(f"Eliminados {num} registros de NotificationLog")
        
        # 8. Cycle Users
        num = db.query(CycleUser).delete()
        print(f"Eliminados {num} registros de CycleUser")
        
        db.commit()
        print("--- Limpieza completada con éxito ---")
    except Exception as e:
        db.rollback()
        print(f"--- ERROR durante la limpieza: {e} ---")
    finally:
        db.close()

if __name__ == "__main__":
    clear_all()
