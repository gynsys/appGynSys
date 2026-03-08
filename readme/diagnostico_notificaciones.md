# 🔍 Diagnóstico de Notificaciones (Lecciones Aprendidas)

Este documento resume los hallazgos tras la investigación de fallos en la entrega de notificaciones PWA y proporciona una guía rápida para resolverlos en el futuro.

---

## 🛑 Problemas Críticos Identificados

### 1. Inconsistencia de VAPID (Error 403 Forbidden)
**Síntoma:** Los logs muestran `403 Forbidden` al intentar enviar notificaciones push.
- **Causa:** Las llaves VAPID en el servidor (`.env`) cambiaron o se regeneraron, pero las usuarias tienen suscripciones generadas con las llaves anteriores.
- **Solución:** Las usuarias deben **re-instalar la PWA** o simplemente cerrar sesión e iniciar sesión de nuevo para que el frontend genere una nueva suscripción con la llave actual.
- **Prevención:** **NUNCA** cambiar las llaves VAPID en producción sin un plan de migración. Si se cambian, todas las notificaciones push fallarán hasta que el usuario actualice su suscripción.

### 2. Bug de Argumentos en `processor.py`
**Síntoma:** Las notificaciones no se programan (la tabla `pending_notifications` está vacía o estancada) para usuarias embarazadas.
- **Causa:** Un error de orden de argumentos posicionales en la llamada a `calculate_smart_context`. Se pasaba `(user, predictions, pregnancy, db)` cuando la función esperaba `(actor, db_session, predictions, pregnancy)`.
- **Efecto:** El objeto `Session` de SQLAlchemy se trataba como datos de predicción, causando errores como `'Session' object has no attribute 'last_period_date'`.
- **Solución:** Mantener siempre el orden: `(actor, db, predictions, pregnancy)`.

---

## 🛠️ Herramientas de Diagnóstico (Scripts)

Hemos creado scripts en `backend/scripts/` para acelerar el diagnóstico:

### 1. `check_user_subs.py`
Verifica el estado completo de un usuario por su email.
```bash
docker exec appgynsys-backend-1 python scripts/check_user_subs.py <email>
```
**Qué muestra:**
- ID del Doctor o CycleUser.
- Llaves VAPID cargadas en la memoria del proceso (para detectar si el `.env` se leyó bien).
- Cantidad de suscripciones push y sus fechas de creación.
- Últimos 5 logs de notificaciones enviadas.
- Lista de notificaciones actualmente programadas (pendientes).

### 2. `test_push_debug.py`
Envía un push de prueba y/o fuerza la evaluación de reglas de negocio.
```bash
# Enviar push de prueba a un Doctor (ID 1 por defecto)
docker exec appgynsys-backend-1 python scripts/test_push_debug.py 1

# Enviar push de prueba a una Usuaria + Forzar evaluación de sus reglas
docker exec appgynsys-backend-1 python scripts/test_push_debug.py --user 30 --eval
```

### 3. `check_failed_notifs.py`
Muestra el error detallado de por qué fallaron las notificaciones en la cola de pendientes.
```bash
docker exec appgynsys-backend-1 python scripts/check_failed_notifs.py
```

---

## 🚀 Flujo de Resolución Rápida
Si una usuaria reporta que no recibe notificaciones:
1. Corre `check_user_subs.py <email>`.
2. Si tiene suscripciones viejas (creadas antes de un cambio de config), pedir que **reinstale la PWA**.
3. Si no tiene notificaciones pendientes, corre `test_push_debug.py --user <id> --eval`.
4. Revisa los logs de error en la consola: `docker logs -f appgynsys-backend-1`.
