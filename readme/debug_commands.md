# 📝 Comandos de Depuración (Cheat Sheet)

Guía rápida de comandos esenciales para el mantenimiento diario del sistema.

## 🐳 Docker & Servicios

| Acción | Comando |
| :--- | :--- |
| **Estado de servicios** | `docker ps` |
| **Reiniciar todo** | `docker compose restart` |
| **Rebuild Backend** | `docker compose build backend && docker compose up -d` |
| **Ver logs del API** | `docker logs -f appgynsys-backend-1` |
| **Ver logs de Celery** | `docker logs -f appgynsys-celery_worker-1` |

## 🗄️ Base de Datos (PostgreSQL)

Entrar a la consola:
```bash
docker exec -it appgynsys-db-1 psql -U postgres -d gynsys
```

### Consultas Rápidas (SQL)
- **Ver últimos usuarios registrados**: `SELECT id, email, created_at FROM doctors ORDER BY created_at DESC LIMIT 5;`
- **Ver errores de notificaciones**: `SELECT * FROM notification_logs WHERE status = 'failed' ORDER BY sent_at DESC LIMIT 10;`
- **Resetear password admin**: `UPDATE doctors SET password_hash = 'HASH' WHERE email = 'admin@appgynsys.com';`

### 🔍 Diagnóstico de Notificaciones (Python Scripts)
- **Ver estado de un usuario**: `docker exec appgynsys-backend-1 python scripts/check_user_subs.py <email>`
- **Prueba de Push + Eval**: `docker exec appgynsys-backend-1 python scripts/test_push_debug.py --user <id> --eval`
- **Ver fallos en cola**: `docker exec appgynsys-backend-1 python scripts/check_failed_notifs.py`

## 📧 Notificaciones & Celery

### Purgar tareas encoladas (Si el sistema se satura):
```bash
docker exec -it appgynsys-celery_worker-1 celery -A app.core.celery_app purge
```

### Verificar tareas activas:
```bash
docker exec -it appgynsys-celery_worker-1 celery -A app.core.celery_app inspect active
```

## 🛠️ Conexión Remota (SSH)

Si usas el script `ssh_runner.py` desde local:
```powershell
python ssh_runner.py "comando_aqui"
```

Ejemplo para ver espacio en disco:
```powershell
python ssh_runner.py "df -h"
```
