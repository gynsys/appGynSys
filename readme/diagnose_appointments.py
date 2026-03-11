import sys
from app.db.base import get_db
from app.services.notifications.processor import trigger_doctor_event
from app.db.models.notification import NotificationRule, PendingNotification
from app.services.notifications.doctor_registry import DOCTOR_NOTIFICATION_MAP, evaluate_doctor_rule
import logging

# Setup basic logging
logging.basicConfig(level=logging.INFO)

def run_diagnostic(doctor_id: int, notification_type: str):
    print(f"\n--- INICIANDO DIAGNÓSTICO PARA DOCTOR {doctor_id} | TIPO: {notification_type} ---")
    
    try:
        db_gen = get_db()
        db = next(db_gen)
        try:
            # 1. VERIFICAR REGLA EN DB
            rule = db.query(NotificationRule).filter(
                NotificationRule.tenant_id == doctor_id,
                NotificationRule.notification_type == notification_type,
                NotificationRule.is_active == True
            ).first()
            
            if rule:
                print(f"[OK] DB: Regla encontrada y ACTIVA (ID: {rule.id})")
            else:
                print(f"[FAIL] DB: Regla NO encontrada o INACTIVA para doctor_id={doctor_id} y tipo={notification_type}")
                # Check ALL rules for this tenant
                all_rules = db.query(NotificationRule).filter(NotificationRule.tenant_id == doctor_id).all()
                print(f"INFO: Reglas totales del doctor {doctor_id}: {[(r.notification_type, r.is_active) for r in all_rules]}")
                return

            # 2. VERIFICAR REGLA EN REGISTRO DE DOCTORES
            rule_def = DOCTOR_NOTIFICATION_MAP.get(notification_type)
            if rule_def:
                print(f"[OK] REGISTRY: Definición de regla encontrada en doctor_registry.py")
            else:
                print(f"[FAIL] REGISTRY: Tipo '{notification_type}' no existe en doctor_registry.py")
                print(f"INFO: Tipos disponibles: {list(DOCTOR_NOTIFICATION_MAP.keys())}")
                return

            # 3. PROBAR EVALUACIÓN DE LÓGICA
            context = {
                "role": "doctor",
                "doctor_name": "Diagnóstico SaaS",
                "patient_name": "Paciente de Prueba",
                "appointment_date": "12/03/2026 09:00",
                "event": "new_appointment" # Dummy event para que pase la lógica si aplica
            }
            logic_pass = evaluate_doctor_rule(rule_def, context)
            print(f"[OK] LOGICA: evaluate_doctor_rule result: {logic_pass}")
            
            if not logic_pass:
                print("[FAIL] LOGICA: La lógica de la regla retornó False. Revisa los predicados en doctor_registry.py.")
                return

            # 4. DISPARAR EVENTO REAL
            print("\nEjecutando trigger_doctor_event...")
            success = trigger_doctor_event(
                doctor_id=doctor_id,
                notification_type=notification_type,
                context=context,
                db=db
            )
            
            print(f"Resultado del trigger: {success}")
            
            if success:
                pending = db.query(PendingNotification).filter(
                    PendingNotification.doctor_id == doctor_id
                ).order_by(PendingNotification.created_at.desc()).first()
                if pending:
                    print(f"[SUCCESS] Notificación encolada correctamente (Pending ID: {pending.id})")
                else:
                    print("[FAIL] El trigger devolvió True pero NO se creó registro en pending_notifications.")
            else:
                print("[FAIL] El trigger devolvió False. Verifica logs de la aplicación para errores de renderizado/DB.")

        finally:
            try:
                next(db_gen)
            except StopIteration:
                pass
    except Exception as e:
        print(f"[ERROR] El diagnóstico falló con una excepción: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Uso: python diagnose_appointments.py <doctor_id> <notification_type>
    if len(sys.argv) < 3:
        print("Uso: python diagnose_appointments.py <doctor_id> <notification_type>")
        print("Ejemplo: python diagnose_appointments.py 1 doctor_new_appointment")
        sys.exit(1)
        
    doc_id_arg = int(sys.argv[1])
    notif_type_arg = sys.argv[2]
    
    run_diagnostic(doc_id_arg, notif_type_arg)
