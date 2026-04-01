# 🛠️ Guía de Mantenimiento SaaS: Campañas y Errores Críticos

Esta guía documenta los procedimientos para resolver problemas comunes de desincronización entre entornos local y producción, específicamente enfocada en el módulo de **Campañas de Difusión**.

---

## 🚨 1. Diagnóstico de errores CORS (Symptom over Cause)

Cuando el navegador reporta un error de `CORS policy` en producción (bloqueo de `api.gynsys.net`), suele ser un "falso positivo" causado por un **Error 500 Interno**.

### ¿Por qué ocurre?
Si el backend crashe durante una petición, Nginx devuelve una página de error propia que **no incluye** las cabeceras `Access-Control-Allow-Origin`. El navegador interpreta esto como un fallo de CORS antes de mostrar el verdadero error 500.

### Solución:
1.  **Revisar Logs del Backend:**
    ```bash
    ssh root@167.172.115.154 "docker logs --tail 50 appgynsys-backend-1"
    ```
2.  **Verificar Tablas:** Si el error ocurre en un módulo nuevo, es probable que la tabla de base de datos no exista (error `UndefinedTable`).

---

## 📂 2. Flujo de Trabajo de Campañas

Para que una campaña se envíe, deben cumplirse 3 etapas:

1.  **Registro (API):** El frontend envía el formulario a `/api/v1/campaigns/`. El backend lo guarda en la tabla `diffusion_campaign`.
2.  **Expansión (Celery Task):** El backend dispara la tarea `process_diffusion_campaign`. 
    - Esta tarea identifica los destinatarios (pacientes/usuarios).
    - Crea registros individuales en la tabla `pending_notifications` con `channel="dual"` o `"email"`.
3.  **Despacho (Celery Beat):** Cada **1 minuto**, el cronjob `process_notification_queue` revisa la tabla `pending_notifications` y realiza el envío real vía Email/Push.

> [!NOTE]
> Tiempo total estimado desde "Lanzar Campaña" hasta el envío: **1 a 2 minutos**.

---

## 🛠️ 3. Reparación de Base de Datos (Fuerza Bruta)

Si las migraciones de Alembic fallan o se desincronizan entre local y producción, usa el script de sincronización forzada:

```bash
# Ejecutar dentro del servidor
ssh root@167.172.115.154 "docker exec -e PYTHONPATH=/app appgynsys-backend-1 python /app/scripts/force_create_campaign_tables.py"
```

Esto creará las tablas `diffusion_campaign` y `campaign_contact` basadas directamente en los modelos de SQLAlchemy, ignorando el estado de Alembic.

---

## 📊 4. Comandos de Supervivencia

### Reiniciar todo el ecosistema de envío:
```bash
python ssh_runner.py "docker restart appgynsys-backend-1 appgynsys-celery_worker-1"
```

### Ver si hay notificaciones en la cola de salida:
```bash
python ssh_runner.py "docker exec appgynsys-db-1 psql -U postgres -d gynsys -c 'SELECT count(*) FROM pending_notifications WHERE status=\"pending\";'"
```

---
**Responsable Técnico:** Antigravity AI  
**Última Actualización:** 31 de Marzo, 2026
