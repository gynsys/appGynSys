"""Script para obtener el traceback completo del error de threading en las notificaciones fallidas"""
from sqlalchemy import text
from app.db.base import SessionLocal
import traceback

db = SessionLocal()

# Ver el error exacto de las notificaciones fallidas
print("=== ERRORES COMPLETOS DE NOTIFICACIONES FALLIDAS ===")
result = db.execute(text("""
    SELECT np.id, cu.email, np.subject, np.last_error
    FROM pending_notifications np
    JOIN cycle_users cu ON cu.id = np.recipient_id
    WHERE np.status = 'failed'
    ORDER BY np.updated_at DESC
    LIMIT 5
"""))
for row in result:
    print(f"\n--- ID:{row.id} {row.email} ---")
    print(f"Asunto: {row.subject}")
    print(f"Error: {row.last_error}")

db.close()

# Ahora simular el envío para reproducir y ver el traceback real
print("\n=== SIMULANDO ENVIO DE NOTIFICACION ===")
db2 = SessionLocal()
try:
    from app.services.notifications.sender import send_dual_notification_logic
    from app.db.models.notification import PendingNotification
    
    failed = db2.query(PendingNotification).filter(
        PendingNotification.status == 'failed'
    ).first()
    
    if failed:
        print(f"Intentando enviar: ID={failed.id}, asunto={failed.subject}")
        try:
            result = send_dual_notification_logic(db2, failed)
            print(f"Resultado: {result}")
        except Exception as e:
            print(f"ERROR CAPTURADO:")
            traceback.print_exc()
except Exception as e:
    print(f"Error al importar: {e}")
    traceback.print_exc()
finally:
    db2.close()
