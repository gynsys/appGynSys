---
description: Diagnóstico y depuración del sistema de notificaciones y base de datos (Mi Ciclo)
---

# Guía de Diagnóstico: Notificaciones y Base de Datos

Esta guía contiene comandos precisos para diagnosticar fallos en las notificaciones (Push/Email) y consultar el estado de las usuarias en el servidor remoto.

## 1. Conexión y Estado de Contenedores

Para ver si los servicios de Celery y la Base de Datos están corriendo:

```powershell
python ssh_runner.py "docker ps"
```

## 2. Consultas a la Base de Datos (Seguras)

Para evitar problemas de escape de caracteres en PowerShell, usa siempre `docker exec` con comillas simples para la consulta SQL interna.

### Ver perfil de una usuaria por email:
```powershell
python ssh_runner.py "docker exec appgynsys-db-1 psql -U postgres -d gynsys -c \"SELECT id, email, nombre_completo, is_active FROM cycle_users WHERE email = 'USUARIO@GMAIL.COM';\""
```

### Ver configuración de notificaciones (anticonceptivos, etc):
```powershell
python ssh_runner.py "docker exec appgynsys-db-1 psql -U postgres -d gynsys -c \"SELECT * FROM cycle_notification_settings WHERE cycle_user_id = (SELECT id FROM cycle_users WHERE email = 'USUARIO@GMAIL.COM');\""
```

### Ver historial de notificaciones enviadas (últimas 24h):
```powershell
python ssh_runner.py "docker exec appgynsys-db-1 psql -U postgres -d gynsys -c \"SELECT status, title_sent, sent_at, channel_used FROM notification_logs WHERE recipient_id = (SELECT id FROM cycle_users WHERE email = 'USUARIO@GMAIL.COM') AND sent_at >= NOW() - INTERVAL '24 hours';\""
```

## 3. Logs de Celery

### Revisar fallos en el Worker (ejecución de tareas):
```powershell
python ssh_runner.py "docker logs --tail 100 appgynsys-celery_worker-1"
```

### Revisar fallos en el Beat (programación de tareas):
```powershell
python ssh_runner.py "docker logs --tail 100 appgynsys-celery_beat-1"
```

## 4. Script de Depuración Avanzada (Python)

Si necesitas inspeccionar lógica compleja, el método más fiable es subir un script vía `scp` y ejecutarlo:

1. Crear un script local `backend/debug_temp.py`.
2. Subirlo:
   ```powershell
   scp -i C:/Users/pablo/.ssh/id_ed25519 ./backend/debug_temp.py root@167.172.115.154:/opt/appgynsys/backend/debug_temp.py
   ```
3. Ejecutarlo dentro del contenedor:
   ```powershell
   python ssh_runner.py "docker exec appgynsys-backend-1 python3 /app/debug_temp.py"
   ```

> [!IMPORTANT]
> El script debe incluir `sys.path.insert(0, '/app')` al inicio para poder importar los módulos de `app.*`.
