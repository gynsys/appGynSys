import sys
import logging
import json
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.base import get_db
from app.db.models.notification import NotificationRule, PendingNotification, NotificationLog
from app.db.models.push_subscription import PushSubscription
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser
from app.services.notifications.doctor_registry import DOCTOR_NOTIFICATION_MAP, evaluate_doctor_rule
from app.services.notifications.processor import trigger_doctor_event
from app.core.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("diagnose_tool")

def check_env():
    print("\n--- 🔧 VERIFICACIÓN DE ENTORNO (VAPID) ---")
    print(f"VAPID_PUBLIC_KEY:  {settings.VAPID_PUBLIC_KEY[:15]}..." if settings.VAPID_PUBLIC_KEY else "VAPID_PUBLIC_KEY:  [MISSING]")
    print(f"VAPID_CLAIM_EMAIL: {settings.VAPID_CLAIM_EMAIL}")
    print(f"NOTIFICACIONES_DEBUG: {settings.NOTIFICATIONS_DEBUG_MODE}")

def check_subscriptions(db: Session, doctor_id: int = None, email: str = None):
    print("\n--- 📱 VERIFICACIÓN DE SUSCRIPCIONES PUSH ---")
    query = db.query(PushSubscription)
    if doctor_id:
        query = query.filter(PushSubscription.doctor_id == doctor_id)
    elif email:
        doc = db.query(Doctor).filter(Doctor.email == email).first()
        if doc:
            query = query.filter(PushSubscription.doctor_id == doc.id)
        else:
            user = db.query(CycleUser).filter(CycleUser.email == email).first()
            if user:
                query = query.filter(PushSubscription.user_id == user.id)
            else:
                print(f"[FAIL] No se encontró doctor o usuario con email: {email}")
                return

    subs = query.all()
    print(f"Encontradas {len(subs)} suscripciones para el filtro dado.")
    for s in subs:
        stype = "Capacitor/FCM" if s.token else "WebPush (PWA)"
        target = f"Doctor ID: {s.doctor_id}" if s.doctor_id else f"User ID: {s.user_id}"
        print(f"  - ID: {s.id} | Tipo: {stype} | Target: {target}")
        print(f"    Creada: {s.created_at} | Actualizada: {s.updated_at}")
        if s.endpoint:
            print(f"    Endpoint: ...{s.endpoint[-30:]}")
        if s.token:
            print(f"    Token: ...{s.token[-30:]}")

def check_logs(db: Session, doctor_id: int = None, limit: int = 10):
    print(f"\n--- 📋 ÚLTIMOS {limit} LOGS PARA DOCTOR {doctor_id or 'TODOS'} ---")
    query = db.query(NotificationLog).order_by(NotificationLog.sent_at.desc())
    if doctor_id:
        query = query.filter(NotificationLog.doctor_id == doctor_id)
    
    logs = query.limit(limit).all()
    for l in logs:
        status_icon = "✅" if l.status == "sent" else "❌"
        print(f"  {status_icon} ID: {l.id} | Tipo: {l.notification_type} | Canal: {l.channel_used} | Status: {l.status} | Fecha: {l.sent_at}")
        if l.error_message:
            print(f"     ⚠ ERROR: {l.error_message}")

def run_diagnostic(doctor_id: int, notification_type: str = None):
    print(f"\n--- 🔍 INICIANDO DIAGNÓSTICO INTEGRAL PARA DOCTOR {doctor_id} ---")
    
    db_gen = get_db()
    db = next(db_gen)
    try:
        # 1. Verificar existencia del Doctor
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doctor:
            print(f"[CRITICAL] Doctor con ID {doctor_id} no existe en la base de datos.")
            return
        print(f"[OK] Doctor: {doctor.nombre_completo} ({doctor.email})")

        # 2. Verificar Entorno
        check_env()

        # 3. Verificar Suscripciones
        check_subscriptions(db, doctor_id=doctor_id)

        # 4. Verificar Regla (si se provee tipo)
        if notification_type:
            print(f"\n--- ⚡ PROBANDO REGLA: {notification_type} ---")
            rule = db.query(NotificationRule).filter(
                NotificationRule.tenant_id == doctor_id,
                NotificationRule.notification_type == notification_type,
                NotificationRule.is_active == True
            ).first()
            
            if rule:
                print(f"[OK] DB: Regla encontrada y ACTIVA (ID: {rule.id})")
            else:
                print(f"[FAIL] DB: Regla NO encontrada o INACTIVA")
                return

            rule_def = DOCTOR_NOTIFICATION_MAP.get(notification_type)
            if not rule_def:
                print(f"[FAIL] REGISTRY: '{notification_type}' no existe en doctor_registry.py")
                return

            # Prueba de trigger (simulada)
            context = {
                "doctor_name": doctor.nombre_completo,
                "patient_name": "Paciente Diagnóstico",
                "appointment_date": datetime.now().strftime("%d/%m/%Y %H:%M"),
                "event": "diagnostic_test"
            }
            
            print("Ejecutando trigger_doctor_event (Simulado)...")
            success = trigger_doctor_event(
                doctor_id=doctor_id,
                notification_type=notification_type,
                context=context,
                db=db
            )
            print(f"Resultado del trigger: {success}")

        # 5. Mostrar Logs recientes
        check_logs(db, doctor_id=doctor_id)

    except Exception as e:
        print(f"[ERROR] El diagnóstico falló: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        try:
            next(db_gen)
        except StopIteration:
            pass

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Herramienta de Diagnóstico Unificada GynSys")
    parser.add_argument("--doc-id", type=int, help="ID del doctor a diagnosticar")
    parser.add_argument("--type", type=str, help="Tipo de notificación a probar (opcional)")
    parser.add_argument("--logs-only", action="store_true", help="Solo mostrar logs recientes")
    parser.add_argument("--subs-only", action="store_true", help="Solo mostrar suscripciones")
    parser.add_argument("--email", type=str, help="Email para buscar suscripciones")
    
    args = parser.parse_args()
    
    db_gen = get_db()
    db = next(db_gen)
    
    if args.logs_only:
        check_logs(db, doctor_id=args.doc_id)
    elif args.subs_only:
        check_subscriptions(db, doctor_id=args.doc_id, email=args.email)
    elif args.doc_id:
        run_diagnostic(args.doc_id, args.type)
    else:
        parser.print_help()
