# GynSys Project - Main Info

Este es el archivo README original del proyecto, trasladado para organizar la documentación.

---

### Servicios Activos
| Servicio | Contenedor | Puerto Interno | Propósito |
| :--- | :--- | :--- | :--- |
| **Backend** | `appgynsys-backend-1` | 8000 | API Principal |
| **Base de Datos**| `appgynsys-db-1` | 5432 | PostgreSQL 15 |
| **Cola de Tareas**| `appgynsys-celery_{worker/beat}`| N/A | Envío de correos y notificaciones |
| **Cache** | `appgynsys-redis-1` | 6379 | Broker de Celery y Cache |

### Guías de Soporte y Mantenimiento
- [🚨 Guía de Diagnóstico de Crisis (502/CORS/Crashes)](file:///c:/Users/pablo/Documents/appgynsys/readme/guia_diagnostico_crisis.md)
- [🛠️ Operaciones SaaS (Tenants, SQL, Backups)](file:///c:/Users/pablo/Documents/appgynsys/readme/saas_ops.md)
- [📝 Cheat Sheet de Comandos](file:///c:/Users/pablo/Documents/appgynsys/readme/debug_commands.md)
- [🎬 Generador de Reels (Video & IA)](file:///c:/Users/pablo/Documents/appgynsys/readme/GENERADOR_REELS_VIDEO.md)

### Conexión Remota (SSH)
Para ejecutar comandos en el servidor desde Windows, usa el runner integrado:
```powershell
python ssh_runner.py "docker ps"
```

**Reinicio de Servicios:**
```bash
ssh root@167.172.115.154 "cd /opt/appgynsys && docker compose restart backend celery_worker"
```

Para más detalles, consultar el archivo [`INFRASTRUCTURE_MAP.md`](./INFRASTRUCTURE_MAP.md) en la raíz.
