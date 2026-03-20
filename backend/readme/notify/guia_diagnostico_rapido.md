# Guía de Diagnóstico Rápido: Notificaciones sin Cuerpo

Si se reportan notificaciones que llegan con solo el título o con el cuerpo vacío, sigue estos pasos para identificar la causa en segundos.

## 1. El Script de Diagnóstico Unificado

Se ha creado un script en el VPS que realiza todas las comprobaciones necesarias de una sola vez.

### Ubicación en el VPS:
`/opt/appgynsys/backend/app/scripts/diagnose_notifications.py`

### Cómo ejecutarlo:
Desde el servidor, ejecuta el siguiente comando:
```bash
docker exec appgynsys-backend-1 python3 app/scripts/diagnose_notifications.py
```

### Para rastrear a un usuario específico:
Añade el correo electrónico al final:
```bash
docker exec appgynsys-backend-1 python3 app/scripts/diagnose_notifications.py usuario@correo.com
```

---

## 2. Qué busca el Script (Workflow)

El script divide el diagnóstico en tres áreas críticas:

### A. Reglas Globales (`notification_rules`)
- **Problema**: Faltan plantillas (`message_template` o `message_text_template`) en la base de datos.
- **Causa típica**: Al añadir nuevas notificaciones, a veces se olvidan las plantillas en la BD.
- **Acción si falla**: Ejecutar el script `patch_notification_templates.py` para restaurar desde el código base (`registry.py`).

### B. Cola de Pendientes (`pending_notifications`)
- **Problema**: Notificaciones ya encoladas tienen el cuerpo nulo.
- **Causa típica**: Se corrigieron las reglas (Paso A), pero las notificaciones del día ya habían sido generadas a las 04:00 AM.
- **Acción si falla**: Ejecutar `repair_pending_bodies.py` para re-poblar los cuerpos de las notificaciones que aún no se han enviado.

### C. Rastreo de Logs (`notification_logs`)
- **Problema**: Confirmar si la notificación realmente se envió y qué canal usó.
- **Acción**: Permite ver los últimos envíos a un usuario específico y confirmar si el estado fue `sent`, `failed` o `skipped`.

---

## 3. Pregunta Clave para Diagnóstico Manual

¿Cuándo se aplicó el parche a las reglas y a qué hora llegó la notificación con error?
- Si la notificación llegó a las **06:00 PM** pero el parche se aplicó a las **10:00 AM**, la notificación **ya estaba rota en la cola** (encolada a las 04:00 AM).
- **Lección**: Siempre que se parcheen reglas de notificación (`notification_rules`), se recomienda verificar/reparar la cola de pendientes (`pending_notifications`) para el resto del día.
