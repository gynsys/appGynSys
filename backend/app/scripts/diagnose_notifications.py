import sys
import os
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

# Setup path for container if needed
sys.path.insert(0, '/app')
os.environ["PYTHONPATH"] = "/app"

def diagnose_all(email_to_check=None):
    # DB URL for the VPS container
    db_url = "postgresql://postgres:GynsysDB2026!Secure@db:5432/gynsys"
    engine = create_engine(db_url)
    
    def safe_print(msg):
        print(str(msg).encode('ascii', 'ignore').decode('ascii'))

    with engine.connect() as conn:
        safe_print("\n=== 1. CHEQUEO DE REGLAS GLOBALES (notification_rules) ===")
        # Buscamos reglas con campos vacíos
        rules_query = text("""
            SELECT id, notification_type, title_template, 
                   (message_text_template IS NOT NULL AND message_text_template != '') as has_text
            FROM notification_rules 
            WHERE is_active = True AND (message_template IS NULL OR message_template = '' OR message_text_template IS NULL OR message_text_template = '')
        """)
        bad_rules = conn.execute(rules_query).fetchall()
        if not bad_rules:
            safe_print("[OK] Todas las reglas activas parecen tener plantillas pobladas.")
        else:
            safe_print(f"[ALERTA] Se encontraron {len(bad_rules)} reglas con plantillas incompletas:")
            for r in bad_rules:
                safe_print(f"  - ID: {r[0]} | Tipo: {r[1]} | Has MessageText: {r[3]}")

        safe_print("\n=== 2. CHEQUEO DE COLA DE PENDIENTES (pending_notifications) ===")
        # Buscamos ítems encolados pero rotos
        pending_query = text("""
            SELECT count(*) 
            FROM pending_notifications 
            WHERE status = 'pending' AND (message_text IS NULL OR message_text = '')
        """)
        pending_broken = conn.execute(pending_query).scalar()
        if pending_broken == 0:
            safe_print("[OK] No hay notificaciones pendientes pronto a enviarse con cuerpo vacío.")
        else:
            safe_print(f"[CRÍTICO] Hay {pending_broken} notificaciones PENDIENTES que se enviarán SIN CUERPO.")
            sample_query = text("""
                SELECT p.id, p.scheduled_for, r.notification_type, p.subject
                FROM pending_notifications p
                JOIN notification_rules r ON p.notification_rule_id = r.id
                WHERE p.status = 'pending' AND (p.message_text IS NULL OR p.message_text = '')
                LIMIT 5
            """)
            samples = conn.execute(sample_query).fetchall()
            for s in samples:
                safe_print(f"  - ID: {s[0]} | Fecha: {s[1]} | Tipo: {s[2]} | Sub: {s[3]}")

        if email_to_check:
            safe_print(f"\n=== 3. RASTREO DE USUARIO ESPECÍFICO: {email_to_check} ===")
            user_query = text("""
                SELECT u.id, u.nombre_completo 
                FROM cycle_users u 
                WHERE u.email = :email
            """)
            user = conn.execute(user_query, {"email": email_to_check}).fetchone()
            if not user:
                safe_print(f"[ERROR] Usuario {email_to_check} no encontrado.")
            else:
                user_id = user[0]
                safe_print(f"Usuario ID: {user_id} | Nombre: {user[1]}")
                
                # Logs del día de ayer y hoy
                logs_query = text("""
                    SELECT l.sent_at, l.notification_type, l.title_sent, l.channel_used, l.status
                    FROM notification_logs l
                    WHERE l.recipient_id = :user_id AND l.sent_at > NOW() - INTERVAL '48 hours'
                    ORDER BY l.sent_at DESC
                """)
                logs = conn.execute(logs_query, {"user_id": user_id}).fetchall()
                if not logs:
                    safe_print("No se encontraron logs de envío en las últimas 48h.")
                else:
                    for l in logs:
                        safe_print(f"  - {l[0]} | {l[1]} | Title: {l[2]} | Chan: {l[3]} | Status: {l[4]}")

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else None
    diagnose_all(email)
