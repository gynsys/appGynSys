"""
Script para resetear notificaciones fallidas a 'pending' para que se reintenten
con el código modular correcto.
Solo actúa sobre las fallidas con error 'threading is not defined'.
"""
from sqlalchemy import text
from app.db.base import SessionLocal
from datetime import datetime
import pytz

tz = pytz.timezone('America/Caracas')
now = datetime.now(tz)

db = SessionLocal()
try:
    # Ver cuántas hay
    result = db.execute(text("""
        SELECT count(*) as total FROM pending_notifications 
        WHERE status = 'failed' AND last_error ILIKE '%threading%'
    """))
    count = list(result)[0].total
    print(f"Notificaciones fallidas por error de threading: {count}")

    if count > 0:
        # Resetear a 'pending' con retry_count=0
        db.execute(text("""
            UPDATE pending_notifications
            SET 
                status = 'pending',
                retry_count = 0,
                last_error = NULL,
                scheduled_for = :now,
                updated_at = :now
            WHERE status = 'failed' AND last_error ILIKE '%threading%'
        """), {"now": now})
        db.commit()
        print(f"Reseteadas {count} notificaciones a 'pending' para reintento automatico.")
    else:
        print("No hay notificaciones pendientes con error de threading.")
    
    # Estado final
    result = db.execute(text("""
        SELECT status, count(*) as total 
        FROM pending_notifications 
        GROUP BY status 
        ORDER BY status
    """))
    print("\nEstado actual de pending_notifications:")
    for row in result:
        print(f"  {row.status}: {row.total}")

except Exception as e:
    db.rollback()
    import traceback
    print(f"ERROR: {e}")
    traceback.print_exc()
finally:
    db.close()
