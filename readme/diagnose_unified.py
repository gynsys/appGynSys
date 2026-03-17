import sys
import logging
import json
import argparse
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configurar rutas para encontrar la app
sys.path.append('/app')

from app.core.config import settings
from app.db.models.notification import NotificationRule, PendingNotification, NotificationLog
from app.db.models.push_subscription import PushSubscription
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser
from app.db.models.cycle_predictor import CycleNotificationSettings, CycleLog
from app.cycle_predictor.logic import calculate_predictions
from app.services.notifications.doctor_registry import DOCTOR_NOTIFICATION_MAP
from app.services.notifications.registry import NOTIFICATION_MAP

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("diagnose_tool")

def get_db_session():
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()

def check_env():
    print("\n--- 🔧 VERIFICACIÓN DE ENTORNO ---")
    print(f"VAPID_PUBLIC_KEY:  {settings.VAPID_PUBLIC_KEY[:15]}..." if settings.VAPID_PUBLIC_KEY else "VAPID_PUBLIC_KEY:  [MISSING]")
    print(f"DATABASE_URL:      {settings.DATABASE_URL.split('@')[-1]}") # Ocultar credenciales
    print(f"NOTIFICACIONES_DEBUG: {settings.NOTIFICATIONS_DEBUG_MODE}")

def check_subscriptions(db: Session, actor_id: int = None, email: str = None, is_doctor: bool = True):
    print("\n--- 📱 SUSCRIPCIONES PUSH ---")
    query = db.query(PushSubscription)
    
    if email:
        doc = db.query(Doctor).filter(Doctor.email == email).first()
        user = db.query(CycleUser).filter(CycleUser.email == email).first()
        if doc:
            query = query.filter(PushSubscription.doctor_id == doc.id)
            print(f"Filtrando por Doctor (ID: {doc.id}, Email: {email})")
        elif user:
            query = query.filter(PushSubscription.user_id == user.id)
            print(f"Filtrando por Usuaria (ID: {user.id}, Email: {email})")
        else:
            print(f"[FAIL] No se encontró nadie con email: {email}")
            return
    elif actor_id:
        if is_doctor:
            query = query.filter(PushSubscription.doctor_id == actor_id)
        else:
            query = query.filter(PushSubscription.user_id == actor_id)

    subs = query.all()
    print(f"Total encontradas: {len(subs)}")
    for s in subs:
        stype = "Native (FCM)" if s.token else "Web (Browser)"
        print(f"  - ID: {s.id} | Tipo: {stype} | Updated: {s.updated_at}")
        if s.token: print(f"    Token: {s.token[:20]}...")
        if s.endpoint: print(f"    Endpoint: ...{s.endpoint[-40:]}")

def check_logs(db: Session, actor_id: int = None, is_doctor: bool = True, limit: int = 15):
    print(f"\n--- 📋 ÚLTIMOS {limit} LOGS ---")
    query = db.query(NotificationLog).order_by(NotificationLog.sent_at.desc())
    if actor_id:
        if is_doctor:
            query = query.filter(NotificationLog.doctor_id == actor_id)
        else:
            query = query.filter(NotificationLog.recipient_id == actor_id)
    
    logs = query.limit(limit).all()
    for l in logs:
        status_icon = "✅" if l.status == "sent" else "❌"
        print(f"  {status_icon} {l.sent_at} | {l.notification_type} | Canal: {l.channel_used} | Status: {l.status}")
        if l.error_message:
            print(f"     ⚠ ERROR: {l.error_message}")

def diagnose_cycle_user(db: Session, email: str):
    print("\n--- 🌸 DIAGNÓSTICO DE CICLO (PACIENTE) ---")
    u = db.query(CycleUser).filter_by(email=email).first()
    if not u:
        print(f"[FAIL] Usuaria {email} no encontrada")
        return
    
    s = db.query(CycleNotificationSettings).filter_by(cycle_user_id=u.id).first()
    l = db.query(CycleLog).filter_by(cycle_user_id=u.id).order_by(CycleLog.start_date.desc()).first()
    
    print(f"Usuaria: {u.nombre_completo} (ID: {u.id})")
    print(f"Config: Ritmo Habilitado = {s.rhythm_method_enabled if s else 'No data'}")
    print(f"Promedios: Ciclo {u.cycle_avg_length} días | Periodo {u.period_avg_length} días")
    
    if l:
        print(f"Último Periodo: {l.start_date}")
        if u.cycle_avg_length:
            preds = calculate_predictions(l.start_date, u.cycle_avg_length, u.period_avg_length)
            hoy = date.today()
            print(f"Hoy: {hoy}")
            print(f"Próximo Periodo (Est): {preds['next_period_start']}")
            dias_para = (preds['next_period_start'] - hoy).days
            print(f"Días restantes para periodo: {dias_para}")
    else:
        print("No hay registros de periodos recientes.")

    check_subscriptions(db, actor_id=u.id, is_doctor=False)
    check_logs(db, actor_id=u.id, is_doctor=False)

def diagnose_doctor(db: Session, email: str):
    print("\n--- 🩺 DIAGNÓSTICO DE DOCTORA ---")
    d = db.query(Doctor).filter_by(email=email).first()
    if not d:
        print(f"[FAIL] Doctora {email} no encontrada")
        return
    
    print(f"Doctora: {d.nombre_completo} (ID: {d.id})")
    check_subscriptions(db, actor_id=d.id, is_doctor=True)
    check_logs(db, actor_id=d.id, is_doctor=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GynSys: Herramienta de Diagnóstico Unificada V2")
    parser.add_argument("--email", type=str, required=True, help="Email del actor (Doctor o Paciente)")
    parser.add_argument("--env", action="store_true", help="Verificar variables de entorno")
    
    args = parser.parse_args()
    db = get_db_session()
    
    try:
        if args.env:
            check_env()
            
        print(f"Investigando: {args.email}")
        # Intentar ambos
        is_user = db.query(CycleUser).filter_by(email=args.email).first()
        is_doc = db.query(Doctor).filter_by(email=args.email).first()
        
        if is_user:
            diagnose_cycle_user(db, args.email)
        if is_doc:
            diagnose_doctor(db, args.email)
        
        if not is_user and not is_doc:
            print(f"[FAIL] No se encontró ninguna cuenta con el email {args.email}")
            
    finally:
        db.close()
