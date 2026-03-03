import json
from sqlalchemy import text
from app.db.base import SessionLocal

db = SessionLocal()

print("=== ESTADO pending_notifications ===")
result = db.execute(text("""
    SELECT status, count(*) as total 
    FROM pending_notifications 
    GROUP BY status 
    ORDER BY status
"""))
for row in result:
    print(f"  {row.status}: {row.total}")

print("\n=== ULTIMAS 10 NOTIFICACIONES FALLIDAS ===")
result = db.execute(text("""
    SELECT np.id, cu.email, np.subject, np.status, np.last_error, np.retry_count, np.scheduled_for
    FROM pending_notifications np
    JOIN cycle_users cu ON cu.id = np.recipient_id
    WHERE np.status = 'failed'
    ORDER BY np.updated_at DESC
    LIMIT 10
"""))
for row in result:
    print(f"  [{row.status}] {row.email} | {row.subject[:40]} | err: {str(row.last_error)[:100]} | retries: {row.retry_count}")

print("\n=== BUSCAR USUARIO PETA ===")
result = db.execute(text("""
    SELECT cu.id, cu.email, cu.nombre_completo, cu.is_active
    FROM cycle_users cu
    WHERE LOWER(cu.email) LIKE '%peta%' OR LOWER(cu.nombre_completo) LIKE '%peta%'
"""))
peta_users = list(result)
for row in peta_users:
    print(f"  ID:{row.id} email:{row.email} nombre:{row.nombre_completo} activo:{row.is_active}")

if peta_users:
    peta_id = peta_users[0].id
    print(f"\n=== PENDING NOTIFICATIONS PETA (ID:{peta_id}) ===")
    result = db.execute(text(f"""
        SELECT np.status, np.subject, np.last_error, np.retry_count, np.scheduled_for, np.channel
        FROM pending_notifications np
        WHERE np.recipient_id = {peta_id}
        ORDER BY np.created_at DESC
        LIMIT 20
    """))
    for row in result:
        print(f"  [{row.status}] {row.subject[:50]} ch:{row.channel} retries:{row.retry_count}")
        if row.last_error:
            print(f"    ERROR: {str(row.last_error)[:150]}")
else:
    print("  No se encontro usuario 'peta'. Buscando todos los usuarios:")
    result = db.execute(text("SELECT id, email, nombre_completo FROM cycle_users LIMIT 20"))
    for row in result:
        print(f"  ID:{row.id} - {row.email} - {row.nombre_completo}")

print("\n=== notification_logs ULTIMAS 24H ===")
result = db.execute(text("""
    SELECT count(*) as total, status
    FROM notification_logs
    WHERE sent_at >= NOW() - INTERVAL '24 hours'
    GROUP BY status
"""))
rows = list(result)
if rows:
    for row in rows:
        print(f"  {row.status}: {row.total}")
else:
    print("  NINGUNA enviada en 24h")

print("\n=== TOTAL EN notification_logs ===")
result = db.execute(text("SELECT count(*) as total FROM notification_logs"))
for row in result:
    print(f"  Total historico: {row.total}")

print("\n=== PUSH SUBSCRIPTIONS ===")
result = db.execute(text("""
    SELECT ps.id, cu.email, LEFT(ps.endpoint, 80) as ep_short
    FROM push_subscriptions ps
    JOIN cycle_users cu ON cu.id = ps.user_id
    LIMIT 10
"""))
subs = list(result)
if subs:
    for row in subs:
        print(f"  user:{row.email} endpoint:{row.ep_short}")
else:
    print("  NO HAY PUSH SUBSCRIPTIONS REGISTRADAS")

db.close()
