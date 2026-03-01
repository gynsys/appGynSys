# 🔔 Guía Completa del Sistema de Notificaciones — Mi Ciclo
> **Propósito:** Esta guía es el punto de entrada único para entender, depurar y mantener el sistema de notificaciones de la aplicación "Mi Ciclo" (GynSys). Cualquier ingeniero o agente de IA puede usarla para asumir el contexto sin investigar desde cero.

---

## 1. Visión General

El sistema de notificaciones es un **pipeline asíncrono** que:
1. **Evalúa** reglas de negocio 1 vez al día por usuaria (04:00 AM VE)
2. **Planifica** notificaciones pendientes en BD (`pending_notifications`)
3. **Envía** las notificaciones cada minuto via **Push Web** y/o **Email**
4. **Registra** el historial en `notification_logs`

### Canales disponibles
| Canal | Descripción |
|-------|-------------|
| `push` | Web Push API (VAPID). Funciona en PWA y navegadores modernos |
| `email` | Correo transaccional via Resend (`resend` Python SDK) |
| `dual` | Intenta push primero, si falla intenta email (ambos si tienen subscripción) |

### Arquitectura de alto nivel

```
CELERY BEAT (scheduler)
    │
    ├── 04:00 AM → run_daily_notification_check()
    │                  └── service.run_daily_evaluation()
    │                       └── _process_single_user() × N usuarios
    │                            ├── calculate_smart_context()
    │                            ├── evaluate_registry_rule() × 108 reglas
    │                            └── PendingNotification → INSERT BD
    │
    ├── Cada 1 min → process_notification_queue()
    │                   └── service.deliver_pending_notifications()
    │                        ├── SELECT pending WHERE scheduled_for <= now
    │                        ├── send_dual_notification_logic()
    │                        │    ├── push_service (Web Push)
    │                        │    └── email (Resend)
    │                        └── UPDATE status → 'sent' | 'retrying' | 'failed'
    │
    └── Cada 10 min → recover_stale_processing()  ✨ NUEVO
                        └── service.recover_stale_processing_notifications()
                             └── UPDATE status 'processing' (>15min) → 'retrying'
```

---

## 2. Mapa de Archivos

### Backend — Archivos activos de producción

```
backend/
├── app/
│   ├── services/
│   │   ├── notifications/         ⭐ PAQUETE MODULAR (Etapa 3)
│   │   │   ├── __init__.py        API pública y re-exports
│   │   │   ├── base.py            Utilidades, logging y circuit breaker
│   │   │   ├── registry.py        Definiciones de reglas y evaluación
│   │   │   ├── context.py         Cálculo de contexto inteligente
│   │   │   ├── processor.py       Orquestación (Daily, Delivery, Recovery)
│   │   │   ├── sender.py          Renderizado y envío físico
│   │   │   └── health.py          Métricas de salud
│   │   └── push_service.py        Push Web (VAPID/webpush)
│   ├── tasks/
│   │   ├── notifications.py          Wrapper Celery → delega a services/
│   │   └── email_tasks.py            Tarea Celery para emails
│   ├── api/v1/endpoints/
│   │   └── notifications.py          Endpoints REST + 4 endpoints de diagnóstico
│   ├── db/models/
│   │   ├── notification.py           Modelos ORM: Rules, Logs, Pending
│   │   └── push_subscription.py     Modelo ORM: PushSubscription
│   ├── schemas/
│   │   └── notification.py           Pydantic: Request/Response schemas
│   ├── core/
│   │   ├── celery_app.py             Config Celery + beat_schedule (3 tareas)
│   │   └── push.py                   Config VAPID client
│   └── seeds/
│       └── notification_rules.py     Seed inicial de reglas en BD
├── alembic/versions/
│   ├── 7baf1dd5b34a_add_cycle_notifications_and_pregnancy.py
│   ├── 20260215_add_pending_notifications.py
│   ├── c933241a7dfe_simplified_notifications_v2.py
│   ├── f96bde83783a_add_cycle_notification_and_pregnancy_.py
│   └── 1a2b3c4d5e6f_add_phase1_notification_fields.py
└── scripts/
    ├── diagnose_notifications.py     Herramienta de diagnóstico
    └── simulate_notification.py      Simula envío de notificación
```

### Frontend — Archivos activos

```
frontend/src/
├── pages/cycle-predictor/
│   └── NotificationsPage.jsx         Página config de notificaciones (usuaria)
├── pages/admin/
│   └── AdminNotificationManagerPage.jsx  Panel admin para editar reglas
├── components/cycle-predictor/
│   └── CycleSettingsTab.jsx          Tab de ajustes (incluye notificaciones)
├── services/
│   ├── notificationService.js        Llamadas API → reglas de notificación
│   └── pushService.js                Registro de suscripción Push
├── hooks/
│   └── usePushNotifications.js       Hook React: activar/desactivar push
├── stores/
│   └── notificationStore.js          Estado global Zustand
└── sw.js                             Service Worker PWA (maneja eventos push)
```

---

## 3. Base de Datos

### Tablas involucradas

#### `notification_rules` — Plantillas globales de notificación
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | int PK | Identificador |
| `notification_type` | varchar(50) | Tipo fijo (ej: `day_1_period_start`) |
| `tenant_id` | int FK→doctors (nullable) | NULL = regla global del sistema |
| `title_template` | varchar(255) | Título con placeholders `{var}` |
| `message_template` | text | HTML con placeholders |
| `message_text_template` | text | Versión plain-text para push |
| `channel` | varchar(20) | `push`, `email`, o `dual` |
| `send_time` | varchar(10) | Hora de envío `HH:MM` (ej: `08:00`) |
| `is_active` | bool | Si la regla está habilitada |
| `priority` | int | Prioridad (menor = más urgente) |
> **Constraint:** `UNIQUE(notification_type, tenant_id)` — Un tipo por tenant/global.

#### `pending_notifications` — Cola de envío
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | int PK | Identificador |
| `recipient_id` | int FK→cycle_users | Destinataria |
| `notification_rule_id` | int FK→notification_rules | Regla origen |
| `subject` | varchar(255) | Asunto/Título ya renderizado |
| `body` | text | HTML ya renderizado |
| `message_text` | text | Plain text para push |
| `scheduled_for` | timestamptz | Cuándo enviar |
| `channel` | varchar(20) | `push`, `email`, o `dual` |
| `status` | varchar(20) | `pending`/`processing`/`sent`/`retrying`/`failed` |
| `retry_count` | int | Número de reintentos |
| `last_error` | text | Último error (truncado a 500 chars) |
| `sent_at` | timestamptz | Cuándo fue enviado |
| `channel_used` | varchar(50) | Canal realmente usado |
> **Constraint:** `UNIQUE(recipient_id, notification_rule_id, date(scheduled_for))` — Sin duplicados por día.

#### `notification_logs` — Historial permanente
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `recipient_id` | int FK→cycle_users | Destinataria |
| `notification_type` | varchar(50) | Tipo de notificación |
| `title_sent` | varchar(255) | Título enviado |
| `channel_used` | varchar(20) | Canal usado |
| `status` | varchar(20) | `sent`, `failed`, `skipped` |
| `sent_at` | timestamptz | Timestamp de envío |

#### `push_subscriptions` — Suscripciones Web Push
> ⚠️ **Esquema real en producción** (diverge del modelo ORM local)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | int PK | Identificador |
| `user_id` | int FK→cycle_users | ⚠️ Campo real es `user_id`, NO `cycle_user_id` |
| `endpoint` | varchar | URL del servidor push del navegador |
| `p256dh` | varchar | Clave pública del cliente |
| `auth` | varchar | Clave de autenticación |
| `user_agent` | varchar | Identificador del dispositivo |
| `created_at` | timestamptz | Registro |
| `updated_at` | timestamptz | Última actualización |

#### Tablas relacionadas (contexto)
- `cycle_users` — Usuarias del sistema de ciclo
- `cycle_notification_settings` — Preferencias por usuaria. Columnas reales: `contraceptive_time`, `menstrual_alerts`, `fertility_alerts`, `fertile_window_alerts`, `ovulation_alert`, `gyn_checkup_alert`, `last_contraceptive_sent_date`, `last_period_reminder_sent`, `rhythm_abstinence_alerts`, `prenatal_ultrasounds`, `prenatal_daily_tips`, etc. (22 columnas)
- `cycle_logs` — Registros de ciclo menstrual (usados para calcular `cycle_day`)
- `pregnancy_logs` — Registros de embarazo (usados para `gestation_week`)
- `symptom_logs` — Síntomas registrados por la usuaria

---

## 4. Tipos de Notificación (98 tipos actuales)

### Categorías

| Categoría | Cantidad | Prefijo | Trigger |
|-----------|----------|---------|---------|
| **Menstrual diario** | 29 | `day_N_`, `period_late_N` | `cycle_day == N` |
| **Prenatal semanal** | 41 | `prenatal_week_N` | `gestation_week == N` |
| **Hitos prenatales** | 10 | `prenatal_*` | `event == "..."` |
| **Sistema** | 6 | `system_*` | eventos de sistema |
| **Anticonceptivos** | 2 | `contraceptive_*` | `type == "contraceptive"` |
| **Método del Ritmo** | 10 | `rhythm_*` | `days_after/before_period` |

### 4.1. Cronograma Dinámico: Los 30 días del Mes (Flujo Ginecología)
Para una usuaria estándar que no está embarazada, el sistema genera el siguiente pipeline de notificaciones a lo largo de un mes (basado en un ciclo asumiendo métricas promedio, ej. regla de 5 días):

**Fase Menstrual (Días 1 al 7)**
- **Día 1:** "Inicio Periodo" (Aviso para registrar flujo).
- **Día 2 al 6:** Chequeos diarios de estado de ánimo, hidratación, dolor y aumento de energía.
- **Día 6 al 10 (RITMO):** "Días Seguros Post-Periodo" (1 al 5 días después de culminar el sangrado).
- **Día 7:** "Fin de Periodo" (Aviso de culminación del flujo).

**Fase Folicular y Ventana Fértil (Días 8 al 15)**
- **Día 8 y 9:** Cuidado de la piel y aviso de que la ventana fértil se acerca.
- **Día 10 al 14:** Alertas de "Fertilidad Alta" y "Pico de Fertilidad", culminando con el aviso de **Ovulación en el Día 14**.
- **Día 15:** "Fin de la Ventana Fértil".

**Fase Lútea Temprana (Días 16 al 21)**
- **Día 16 y 17:** Posible implantación (si hubo concepción) y aviso para empezar a observar el humor.
- **Día 18 al 21:** Tips de ejercicio suave, alerta de aumento de metabolismo (hambre) y resumen del ciclo.

**Fase Lútea Tardía y SPM (Días 22 al 28)**
- **Día 22:** "Posible SPM" (Inicio oficial de síntomas premenstruales).
- **Día 23 al 27:** Chequeos de hinchazón, cambios de ánimo, sensibilidad mamaria y posibles cólicos.
- **Día 24 al 28 (RITMO):** "Días Seguros Pre-Periodo" (Los 5 días previos a la llegada esperada de la menstruación).
- **Día 28:** "Periodo Mañana" (Aviso de que el próximo periodo está a punto de llegar).

**Día 29 en adelante:**
- Alarmas dinámicas de **"Retraso de Periodo"** (1 día de retraso, etc.) si la usuaria no ha registrado su nuevo sangrado.
- *Nota:* Si la usuaria tiene activa la `Píldora Anticonceptiva`, esta se disparará todos los 30 días a su `contraceptive_time` ignorando la fase del ciclo.

### Lógica de evaluación — `NOTIFICATION_REGISTRY`
En `backend/app/services/notifications.py`, el `NOTIFICATION_REGISTRY` es una lista de dicts Python con esta estructura:
```python
{
    "type": "day_6_energy_boost",       # notificación type en BD
    "category": "menstrual",            # menstrual | prenatal | system | contraceptive
    "priority": 105,                    # menor = más urgente (1 = alerta crítica)
    "title": "Día 6 - Energía",        # título por defecto
    "message": "Tu energía aumenta...", # mensaje por defecto
    "logic": lambda c: is_day(c, 6)    # función de evaluación sobre smart_context
}
```
> La lógica `lambda c:` evalúa el `smart_context` dict — si retorna `True`, la notificación se crea.

---

## 5. Flujo Detallado de Code

### 5.1 Evaluación diaria — `run_daily_evaluation()`
**Archivo:** `backend/app/services/notifications.py` línea ~696

```
run_daily_evaluation()
  ├── Carga reglas globales desde cache: get_cached_global_rules(ttl_hash)
  │    └── @lru_cache → Dict[str, _RuleData] (datos primitivos, SIN sesión ORM)
  ├── Lee todos los cycle_user.id activos (yield_per=100 para streaming)
  └── Para cada user_id → _process_single_user(user_id, global_rules, now, today)
```

### 5.2 Procesamiento por usuario — `_process_single_user()`
**Archivo:** `backend/app/services/notifications.py` línea ~525

```
_process_single_user(user_id, global_rules, now, today_date)
  ├── Abre sesión independiente (session_scope)
  ├── Carga: user, user_settings, pregnancy, last_cycle
  ├── calculate_predictions() → dict de predicciones
  ├── calculate_smart_context() → smart_ctx dict
  │    ├── cycle_day           → día actual del ciclo
  │    ├── is_pregnant         → bool
  │    ├── gestation_week      → semana de embarazo
  │    ├── type                → "contraceptive" | "menstrual" | "prenatal"
  │    ├── subtype             → "active_pill" | "placebo" | etc.
  │    └── event               → evento especial (si aplica)
  ├── validate_smart_context() → validación mínima
  ├── Cuenta notificaciones hoy (sent_today + pending_today)
  │    └── Si >= MAX_NOTIFICATIONS_PER_USER_PER_DAY (5) → RETURN
  └── Para cada regla en NOTIFICATION_REGISTRY:
       ├── evaluate_registry_rule(rule_def, smart_ctx, user_settings)
       ├── Si pasa: obtiene _RuleData del cache
       ├── Calcula send_time (usa contraceptive_time si es anticonceptivo)
       └── INSERT PendingNotification (con flush + IntegrityError guard)
```

### 5.3 Envío — `deliver_pending_notifications()`
**Archivo:** `backend/app/services/notifications.py` línea ~740

```
deliver_pending_notifications()
  ├── SELECT ids WHERE status IN ('pending','retrying') AND scheduled_for <= now
  │    └── WITH FOR UPDATE SKIP LOCKED (anti-collisión entre workers)
  ├── UPDATE status = 'processing'
  └── Para cada id:
       ├── reload item con joinedload(rule) en nueva sesión
       ├── send_dual_notification_logic(db, item)
       │    ├── Intenta PUSH si hay suscripción activa
       │    │    └── push_service → webpush() con VAPID
       │    └── Intenta EMAIL si tiene email
       │         └── resend.Emails.send()
       ├── Si éxito: status='sent', INSERT NotificationLog
       └── Si fallo:
            ├── retry_count += 1
            ├── Si retry_count < MAX_RETRIES (5): status='retrying'
            └── Si >= MAX_RETRIES: status='failed'
```

### 5.4 Re-evaluación inmediata — `trigger_immediate_evaluation()`
**Archivo:** `backend/app/services/notifications.py` línea ~661

Se llama cuando el usuario cambia sus configuraciones, registra un ciclo, etc.:
1. Borra `pending_notifications` de hoy con status `pending`/`retrying`
2. Corre `_process_single_user()` de nuevo
3. Llama `deliver_pending_notifications()` para envío inmediato si hay algo listo

---

## 6. Celery Schedule

**Archivo:** `backend/app/core/celery_app.py`

| Tarea | Schedule | Función invocada |
|-------|----------|-----------------|
| `run-daily-notification-check` | `04:00 AM` (VE) | `run_daily_evaluation()` |
| `process-notification-queue` | Cada **1 minuto** | `deliver_pending_notifications()` |
| `recover-stale-processing` | Cada **10 minutos** | `recover_stale_processing_notifications()` |

> ⚠️ El timezone del Celery es `America/Caracas` (`UTC-4`). Las horas en `notification_rules.send_time` están en Caracas.

---

## 7. Variables de Entorno Requeridas

| Variable | Uso |
|----------|-----|
| `CELERY_BROKER_URL` | URL de Redis (ej: `redis://redis:6379/0`) |
| `DATABASE_URL` | PostgreSQL (ej: `postgresql://user:pass@db:5432/gynsys`) |
| `VAPID_PUBLIC_KEY` | Clave pública VAPID para Web Push |
| `VAPID_PRIVATE_KEY` | Clave privada VAPID |
| `VAPID_CLAIM_EMAIL` | Email del servidor para claim VAPID |
| `RESEND_API_KEY` | API key de Resend para emails |
| `EMAIL_FROM` | Dirección remitente para emails |
| `NOTIFICATIONS_DEBUG_MODE` | `bool`, default `False`. Cuando `True`: bypasea la guardia de 1 notif/tipo/día y permite re-enviar la misma notificación múltiples veces el mismo día. **Solo para pruebas.** |

---

## 8. Endpoints REST

**Prefijo:** `/api/v1/notifications`

### Gestión de Reglas
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/rules` | SuperAdmin | Listar todas las reglas globales |
| `GET` | `/rules/{type}` | SuperAdmin | Ver regla por tipo |
| `PUT` | `/rules/{type}` | SuperAdmin | Editar contenido de regla |

### Push Subscription (Usuaria)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/vapid-public-key` | CycleUser | Obtener clave pública VAPID |
| `POST` | `/subscribe` | CycleUser | Registrar suscripción push del navegador |
| `POST` | `/unsubscribe` | CycleUser | Cancelar suscripción push |

### Diagnóstico y Debug (SuperAdmin Only) — ✨ NUEVO
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Estado global: cola, fallos, enviadas 24h, circuit breaker |
| `GET` | `/debug/user/{id}` | Cola + historial de notificaciones de una usuaria |
| `POST` | `/debug/user/{id}/retry` | Resetea `failed` → `pending` (con `retry_count=0`) para re-intento inmediato |
| `POST` | `/debug/user/{id}/evaluate` | Fuerza re-evaluación inmediata via `trigger_immediate_evaluation()` |

#### Ejemplo de uso
```bash
TOKEN="Bearer <superadmin_token>"
BASE="https://api.gynsys.net/api/v1/notifications"

# Ver estado del sistema
curl -H "Authorization: $TOKEN" $BASE/health

# Diagnosticar usuaria ID=30 (peta)
curl -H "Authorization: $TOKEN" $BASE/debug/user/30

# Resetear sus fallos para reintento inmediato
curl -X POST -H "Authorization: $TOKEN" $BASE/debug/user/30/retry

# Forzar evaluación completa
curl -X POST -H "Authorization: $TOKEN" $BASE/debug/user/30/evaluate
```

---

## 8b. Eventos Estructurados de Log ✨ NUEVO

Todos los eventos emiten JSON plano en los logs del container, filtrable con `grep`.

| Evento | Nivel | Cuándo se emite |
|--------|-------|------------------|
| `EVAL_TRIGGERED` | info | Inicio de evaluación para un usuario |
| `RULE_SKIPPED` | info | Regla que NO genera notificación |
| `RULE_QUEUED` | info | Regla evaluada como verdadera, notificación creada en cola |
| `sent` | info | Notificación entregada exitosamente |
| `retry` | info | Reintento por fallo temporal |
| `permanent_failure` | error | Agotó `MAX_RETRIES` sin éxito |

#### Valores del campo `reason` en `RULE_SKIPPED`
| Reason | Significado |
|--------|-------------|
| `logic_false` | La lambda del NOTIFICATION_REGISTRY retornó False |
| `already_sent` | Ya existe en `sent_today` o `pending_today` |
| `already_sent_but_debug_bypass` | Ya enviada pero `DEBUG_MODE=True`, se creó de nuevo |
| `daily_limit` | Se alcanzó `MAX_NOTIFICATIONS_PER_USER_PER_DAY` |

#### Filtrar eventos de log en producción
```bash
# Ver solo eventos RULE_QUEUED del worker
docker logs appgynsys-celery_worker-1 2>&1 | grep RULE_QUEUED | tail -20

# Ver por qué se saltó la notificación de la píldora
docker logs appgynsys-backend-1 2>&1 | grep contraceptive_daily | tail -10

# Ver evaluaciones del usuario ID=30
docker logs appgynsys-backend-1 2>&1 | grep '"user_id": 30' | tail -20
```

---

## 9. Frontend — Flujo de Activación Push


**Hook principal:** `frontend/src/hooks/usePushNotifications.js`

```
subscribeToPush()
  1. Solicita permiso de notificaciones al navegador
  2. GET /notifications/vapid-public-key → obtiene clave pública del servidor
  3. navigator.serviceWorker.ready → pushManager.subscribe()
  4. POST /notifications/subscribe → envía { endpoint, keys: { p256dh, auth } }

unsubscribeFromPush()
  1. pushManager.getSubscription()
  2. POST /notifications/unsubscribe → backend borra la suscripción
  3. subscription.unsubscribe() → browser
```

**Service Worker:** `frontend/src/sw.js`
- Escucha eventos `push` del sistema operativo
- Extrae `title` y `body` del payload JSON
- Muestra `self.registration.showNotification()`

---

## 10. Guía de Depuración

### 10.1 Comandos de diagnóstico en producción

```bash
# Estado de los contenedores (todos deben estar Up)
ssh root@167.172.115.154 "docker compose -f /opt/appgynsys/docker-compose.yml ps"

# Logs en tiempo real del Celery worker
ssh root@167.172.115.154 "docker logs appgynsys-celery_worker-1 --tail 50 -f"

# Logs del backend
ssh root@167.172.115.154 "docker logs appgynsys-backend-1 --tail 50"

# Solo errores en los logs del backend
ssh root@167.172.115.154 "docker logs appgynsys-backend-1 2>&1 | grep -i 'error\|fail\|exception' | tail -30"
```

### 10.2 Consultas SQL de diagnóstico

```bash
# Conectarse a la BD en producción (¡El nombre real de la BD es 'gynsys'!)
docker exec -i appgynsys-db-1 psql -U postgres -d gynsys

# Comando rápido para contar notificaciones agrupadas por categoría
docker compose exec -T db psql -U postgres -d gynsys -c "SELECT category, COUNT(*) FROM notification_rules GROUP BY category;"
```

```sql
-- Estado general de la cola de notificaciones
SELECT status, count(*), min(created_at), max(created_at) 
FROM pending_notifications 
GROUP BY status;

-- Últimas 10 notificaciones fallidas con el error
SELECT id, recipient_id, last_error, retry_count, created_at 
FROM pending_notifications 
WHERE status = 'failed' 
ORDER BY created_at DESC LIMIT 10;

-- Notificaciones pendientes por usuario hoy
SELECT recipient_id, count(*) as cantidad
FROM pending_notifications 
WHERE DATE(scheduled_for) = CURRENT_DATE 
  AND status IN ('pending', 'retrying')
GROUP BY recipient_id;

-- Ver reglas activas del sistema (lo que está en BD)
SELECT notification_type, channel, send_time, is_active 
FROM notification_rules 
WHERE tenant_id IS NULL 
ORDER BY priority;

-- Verificar suscripciones push activas (campo real user_id, no cycle_user_id)
SELECT user_id, created_at, left(endpoint, 60) as endpoint_preview
FROM push_subscriptions 
ORDER BY created_at DESC LIMIT 10;

-- Diagnosticar fallo de un usuario específico (reemplaza el ID)
SELECT id, status, last_error, retry_count, scheduled_for, channel
FROM pending_notifications 
WHERE recipient_id = <USER_ID>
ORDER BY created_at DESC LIMIT 10;

-- Encontrar cycle_user por email (para obtener su ID)
SELECT id, nombre_completo, email FROM cycle_users WHERE email ILIKE '%parte_del_email%';

-- Historial de envíos de los últimos 7 días
SELECT notification_type, channel_used, status, count(*) 
FROM notification_logs 
WHERE sent_at >= NOW() - INTERVAL '7 days'
GROUP BY notification_type, channel_used, status
ORDER BY count(*) DESC;
```

### 10.3 Errores comunes y soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `NameError: name 'threading' is not defined` | Celery fork worker no hereda el scope global del módulo | ✅ **RESUELTO** en commit `e9da035` — `get_worker_id()` usa `import threading` local con `try/except` |
| `DetachedInstanceError: Instance <NotificationRule>` | Objetos ORM cacheados accedidos fuera de sesión activa | ✅ **RESUELTO** en commit `e9da035` — `get_cached_global_rules()` ahora usa `_RuleData` (datos primitivos) |
| `pg_dump: no password supplied` | Variable `PGPASSWORD` no pasa correctamente al comando de backup | Verificar el código de backup automático en `main.py` startup |
| `push: 410 Gone` | Suscripción push expirada/cancelada en el navegador | El backend debe borrar la suscripción y continuar |
| `resend error: Invalid API Key` | `RESEND_API_KEY` no configurada en el container | Verificar `.env` en `/opt/appgynsys/backend/.env` |
| Notificaciones en `pending` sin enviarse | Celery worker no está corriendo o Redis caído | Verificar containers: `docker ps`, reiniciar: `docker compose restart celery_worker` |
| Límite diario alcanzado | Más de 5 notificaciones por día por usuaria | Constante `MAX_NOTIFICATIONS_PER_USER_PER_DAY = 5` en `services/notifications.py` |
| `Unique constraint: uix_pending_user_rule_date` | Intento de duplicar la misma notificación en el mismo día | Normal — el sistema lo captura con `IntegrityError` y continua |

### 10.4 Verificar si Celery está procesando

```bash
# Ver si procesa tareas (debe mostrar "succeeded")
docker logs appgynsys-celery_worker-1 --tail 20

# Forzar ejecución inmediata de la evaluación diaria
docker exec appgynsys-celery_worker-1 celery -A app.core.celery_app call app.tasks.notifications.run_daily_notification_check

# Forzar envío de la cola pendiente ahora
docker exec appgynsys-celery_worker-1 celery -A app.core.celery_app call app.tasks.notifications.process_notification_queue
```

### 10.5 Verificar configuración VAPID

```bash
# Verificar que VAPID keys estén presentes en el container
docker exec appgynsys-backend-1 printenv | grep VAPID

# Probar endpoint de VAPID key (debe retornar public_key)
curl -H "Authorization: Bearer <TOKEN_CYCLE_USER>" \
     https://tu-dominio.com/api/v1/notifications/vapid-public-key
```

### 10.6 Re-deployar cambios en producción

```bash
# En la máquina local (PowerShell Windows)
git add .
git commit -m "fix: descripción del fix"
git push origin main

# En el Droplet (via SSH)
ssh root@167.172.115.154
cd /opt/appgynsys
git pull origin main
docker compose restart celery_worker celery_beat backend
```

---

## 11. Lógica de `smart_context` — Variables disponibles en plantillas

La función `calculate_smart_context()` en `services/notifications.py` retorna:

```python
{
    # Universal (siempre presente)
    "today": date,
    "is_pregnant": bool,

    # Si NO está embarazada — Contexto menstrual
    "cycle_day": int,          # Día actual del ciclo (1=primer día de periodo)
    "type": "menstrual",
    "days_since_period": int,

    # Si está embarazada — Contexto prenatal
    "type": "prenatal",
    "gestation_week": int,     # Semana de gestación actual
    "days_pregnant": int,

    # Si tiene anticonceptivo activo
    "type": "contraceptive",
    "subtype": "active_pill" | "placebo" | "no_pill",

    # Síntomas del día
    "has_symptoms": bool,
    "symptoms_today": list,

    # Eventos especiales (set externamente)
    "event": str | None,       # Ej: "period_late", "appointment_tomorrow"
}
```

---

## 12. Configuración por Usuaria (`cycle_notification_settings`)

La tabla `cycle_notification_settings` guarda las preferencias de notificación:
- `is_enabled` — Activa/desactiva todas las notificaciones
- `contraceptive_time` — Hora preferida para recordatorio anticonceptivo (override de `send_time` de la regla)
- `menstrual_enabled`, `prenatal_enabled`, etc. — Por categoría

La función `evaluate_registry_rule()` en `services/notifications.py` respeta estas preferencias antes de crear una notificación.

---

## 13. Estructura del `_RuleData` (Cache)

Desde el commit `e9da035`, el cache de reglas usa `_RuleData` — **no objetos ORM**:

```python
class _RuleData:
    __slots__ = (
        "id", "notification_type", "send_time", "channel",
        "title_template", "message_text_template", "is_active", "priority",
    )
```

> **Por qué:** Los objetos ORM de SQLAlchemy quedan ligados a la sesión DB con la que fueron cargados. Si se cachean con `@lru_cache`, la sesión se cierra pero el objeto sigue en memoria sin sesión → `DetachedInstanceError` al acceder a atributos. `_RuleData` extrae los datos primitivos mientras la sesión está abierta.

---

## 14. Historial de Bugs Resueltos

| Commit | Bug | Fix |
|--------|-----|-----|
| `7cf0ef9` | `DetachedInstanceError` con `make_transient` | Primer intento de fix con `expunge + make_transient` (insuficiente) |
| `e9da035` | `threading is not defined` en `ForkPoolWorker` | `get_worker_id()` con `import threading` local + `try/except` |
| `e9da035` | `DetachedInstanceError` persistente | Cache usa `_RuleData` (datos nativos Python, sin ligadura ORM) |
| `e9da035` | `log_notification_event` podía bloquear el envío | Wrapeado en `try/except` silencioso |
| `530872f` | `'_RuleData' object has no attribute 'render_content'` | `safe_render_content()` actualizada para detectar tipo con `hasattr` y renderizar manualmente con `format_map()` — detectado al investigar fallo de píldora anticonceptiva para usuaria "peta" (ID=30) |

> **Caso real documentado (2026-02-23):** La usuaria `peta` (dramarielh@gmail.com, `cycle_user_id=30`) tenía 7 notificaciones en `pending_notifications` con `status='failed'`. Dos errores distintos: (1) históricas con `name 'threading' is not defined` — resueltas en `e9da035`; (2) las más recientes con `'_RuleData' object has no attribute 'render_content'` — el fix de `_RuleData` rompió `safe_render_content()`. Resuelto en `530872f`.

---

## 15. Infraestructura de Producción

| Servicio | Container | Imagen |
|----------|-----------|--------|
| Backend / FastAPI | `appgynsys-backend-1` | Dockerfile local |
| Celery Worker | `appgynsys-celery_worker-1` | Misma imagen que backend |
| Celery Beat | `appgynsys-celery_beat-1` | Misma imagen que backend |
| PostgreSQL 15 | `appgynsys-db-1` | `postgres:15-alpine` |
| Redis | `appgynsys-redis-1` | `redis:alpine` |
| Nginx | `appgynsys-nginx-1` | `nginx:1.24-alpine` |
| MinIO | `appgynsys-minio-1` | `minio/minio` |

**Servidor:** DigitalOcean Droplet — IP `167.172.115.154`  
**App location:** `/opt/appgynsys`  
**SSH:** `ssh root@167.172.115.154`  
**docker-compose:** `/opt/appgynsys/docker-compose.yml`

---

## 16. Confiabilidad y Control de Frecuencia

### 16.1 Múltiples Notificaciones y Cambios de Horario (Actualizado)

El sistema **ya no tiene límites** arbitrarios por día o por categoría. Todas las reglas que evalúen como verdaderas en un día (e.g. `prenatal_week_28` y `prenatal_glucose_test`) se enviarán simultáneamente, permitiendo la máxima flexibilidad en la comunicación.

**¿Qué pasa si una usuaria cambia la hora de envío (ej. hora de la píldora) en el mismo día?**
- Si la notificación **ya se envió** a la hora antigua: 
  - Si la **nueva hora** está en el **futuro** (hoy), el sistema encolará y **reenviará** la notificación en ese nuevo horario. Esto garantiza que la usuaria reciba la alerta independientemente del cambio que haga en el día.
  - Si la **nueva hora** está en el **pasado** (hoy), el sistema **respetará el envío original** y no volverá a hacer _spam_ hasta el día siguiente.

El sistema utiliza la restricción lógica de `pending_rule_ids` y `sent_rule_ids` contrastado con el `target_time > now` para lograr este comportamiento sin duplicar _infinitamente_ notificaciones en cada re-evaluación (`trigger_immediate_evaluation`).

Para el DEBUG: `NOTIFICATIONS_DEBUG_MODE=True` (variable en el `.env`) bypasea de todas formas los chequeos para recrear notificaciones enviadas, permitiendo forzar el envío constante en pruebas.

### 16.2 Recovery de `processing` Huérfano

El estado `processing` es **el punto más frágil del sistema**: si un Celery worker muere en mitad de un envío (OOM, reinicio del container), la notificación queda atascada en `processing` para siempre.

**Solución implementada:** tarea `recover_stale_processing` ejecutada cada 10 minutos:

```python
# Consulta que realiza la tarea:
UPDATE pending_notifications
SET status='retrying', retry_count = retry_count + 1,
    scheduled_for = NOW() + INTERVAL '2 min'
WHERE status = 'processing'
AND updated_at < NOW() - INTERVAL '15 min'
```

Cuando hay registros rescatados, se emite un `logger.WARNING` visible con:
```
[RECOVERY] Rescued 3 stale 'processing' notifications (stuck >15min). IDs: [12, 45, 67]
```

**Verificar manualmente en producción:**
```bash
ssh root@167.172.115.154
docker exec appgynsys-db-1 psql -U postgres -d gynsys -c \
  "SELECT id, recipient_id, status, updated_at FROM pending_notifications WHERE status='processing';"
```

### 16.3 Invalidación de Cache de Reglas

La función `get_cached_global_rules()` usa `@lru_cache` con TTL de 1 hora. Cuando un admin edita una regla vía `PUT /api/v1/notifications/rules/{type}`, el cache del proceso actual se invalida inmediatamente:

```python
# Sucede automáticamente en update_rule():
get_cached_global_rules.cache_clear()
```

> **Limitación:** Solo invalida el cache en el **proceso que recibió el request** (el backend).
> Los Celery workers tienen cada uno su propio cache y tardan hasta 1h en actualizarse.
> Si necesitas actualizar inmediatamente en todos los workers, reinicia el container celery_worker.

---

## 17. Roadmap de Mejoras Futuras

Las siguientes etapas están planificadas para hacer el sistema más robusto:

| Etapa | Descripción | Prioridad | Estado |
|-------|-------------|-----------|--------|
| **4** | Tests automáticos para `evaluate_registry_rule()` y el pipeline completo | Alta | ✅ Completado |
| **5** | Dashboard visual de salud en la UI admin (conectar `/health` endpoint) | Alta | ✅ Completado |
| **6** | Cache de reglas en Redis (compartido entre todos los workers) | Media | ⏳ Pendiente |
| **7** | Circuit Breaker distribuido vía Redis | Media | ⏳ Pendiente |
| **8** | Panel admin para operar retry/evaluate sin SSH | Alta | ✅ Parcial (API lista) |
| **9** | Preferencias de ventana horaria por usuaria | Media | ⏳ Pendiente |
| **10** | Exactly-once delivery: push → email → SMS para alertas críticas | Alta | ⏳ Pendiente |
| **11** | Modularización de `services/notifications.py` en sub-módulos | Baja | ✅ Completado |

### Etapa más urgente: Tests (Etapa 4)

El test mínimo que previene la regresión más común:

```python
# backend/tests/test_notifications.py
def test_safe_render_content_with_rule_data():
    """Garantiza que _RuleData puede ser renderizado por safe_render_content."""
    from app.services.notifications import _RuleData, safe_render_content, NOTIFICATION_REGISTRY
    # Simular un _RuleData (no requiere DB real si se mockea el ORM)
    rule_dict = NOTIFICATION_REGISTRY[0]  # contraceptive_daily por ejemplo
    rendered = safe_render_content_from_dict(rule_dict, {"patient_name": "Ana"})
    assert rendered is not None
```

---

## 18. Guía de Limpieza de Base de Datos y Resolución de Problemas (Troubleshooting Avanzado)

Durante el mantenimiento y la actualización de reglas de notificación, es muy común encontrarse con dos grandes bloqueadores al intentar manipular la base de datos de producción directamente mediante scripts de Python:
1. **Problemas de Entorno (ModuleNotFound):** El `sys.path` dentro del contenedor Docker no reconoce la carpeta `/app` ni `app.db` adecuadamente si no se ejecuta desde el punto de montaje y usuario correctos.
2. **Violaciones de Llave Foránea (IntegrityError):** Las reglas de notificación (`notification_rules`) no pueden borrarse si existen notificaciones encoladas (`pending_notifications`) que dependan de ellas.

Para evitar perder tiempo con comandos bloqueados mediante SSH y scripts asilados, **siempre** sigue esta guía cuando necesites borrar datos obsoletos o recrear (re-seed) permisos o notificaciones en producción.

### 18.1. Solución Definitiva para Scripts Manuales en el VPS (Droplet)

No ejecutes comandos de Python en línea (`python -c "..."`) ni uses `bash -c "cat <<EOF"` desde PowerShell hacia SSH, porque los caracteres de escape (`"` y `'`) se corrompen provocando errores de sintaxis o fallando silenciosamente.

**El flujo correcto paso a paso es:**

**Paso 1: Escribir el script localmente**
Crea el script en tu máquina (por ejemplo `temp_deploy/force_clean.py`).

⚠️ **Importante:** Para evitar el `ModuleNotFoundError: No module named 'app'`, siempre inyecta el path `/app` en la primera línea de tu script antes de hacer cualquier import del proyecto:
```python
import sys
import os
# Fuerza a Python a mirar en la carpeta /app para que encuentre el módulo 'app'
# independientemente del directorio de trabajo actual
sys.path.insert(0, "/app")
os.environ["PYTHONPATH"] = "/app"

from sqlalchemy import text
from app.db.base import SessionLocal  # Asegúrate de usar app.db.base, NO app.db.session
```

**Paso 2: Subir el script al servidor de forma cruda**
Usa `scp` (Secure Copy Protocol) para enviar el archivo `.py` limpio a la carpeta scripts del servidor:
```bash
scp C:\Users\pablo\Documents\appgynsys\temp_deploy\force_clean.py root@167.172.115.154:/opt/appgynsys/backend/scripts/
```

**Paso 3: Ejecutar dentro de Docker forzando el path**
Entra por SSH normal y dile a `docker compose` que ejecute el archivo con Python, diciéndole a bash explícitamente que cambie a la carpeta `/app` primero:
```bash
ssh root@167.172.115.154
cd /opt/appgynsys
docker compose exec -T backend bash -c 'cd /app && PYTHONPATH=/app python scripts/force_clean.py'
```

### 18.2. Manejo de Integridad Referencial (Cascade Deletes)

Si intentas borrar reglas del sistema (`notification_rules`), PostgreSQL te detendrá con `psycopg2.errors.ForeignKeyViolation` si algún usuario tiene esa notificación en cola para ser enviada. 

Para borrar reglas de forma segura, tu script SIEMPRE debe buscar y eliminar las dependencias de `pending_notifications` **primero**.

**Script plantilla de borrado seguro (`force_clean.py`):**
```python
import sys
import os
sys.path.insert(0, "/app")
os.environ["PYTHONPATH"] = "/app"

from sqlalchemy import text
from app.db.base import SessionLocal
from app.db.models.notification import NotificationRule, PendingNotification
from app.seeds.notification_rules import seed_notification_rules

def run():
    db = SessionLocal()
    
    print("1. Buscando reglas para borrar...")
    # Ejemplo: Encontrar reglas con prefijo "prenatal_week_"
    rule_ids = db.query(NotificationRule.id).filter(
        NotificationRule.notification_type.like("prenatal_week_%")
    ).all()
    rule_ids = [r[0] for r in rule_ids]
    
    if rule_ids:
        print(f"Borrando dependencias para {len(rule_ids)} reglas encontradas...")
        deleted_pending = db.query(PendingNotification).filter(
            PendingNotification.notification_rule_id.in_(rule_ids)
        ).delete(synchronize_session=False)
        print(f"  -> Eliminadas {deleted_pending} notificaciones pendientes asociadas.")

    print("2. Borrando las reglas maestras...")
    deleted_rules = db.query(NotificationRule).filter(
        NotificationRule.id.in_(rule_ids)
    ).delete(synchronize_session=False)
    db.commit()
    print(f"  -> Borradas {deleted_rules} reglas obsoletas.")

    print("3. Recreando notificaciones globales (seeding)...")
    seed_notification_rules(db, None)
    
    print("4. Recreando configuraciones para cada doctor (Tenant)...")
    tenants = db.execute(text("SELECT id FROM doctors")).fetchall()
    for t in tenants:
        seed_notification_rules(db, t[0])

    print("¡Terminado correctamente!")

if __name__ == "__main__":
    run()
```

### 18.3. Reinicio de Cache (Paso final obligatorio)

Las notificaciones de Global Rules y el framework de Celery mantienen el cache fuertemente atado a la memoria RAM. Al hacer cualquier cambio directo en la base de datos (con scripts o SQL), debes matar y reiniciar esos contenedores, o los envíos fallarán por inconsistencia de datos (`DetachedInstanceError` o IDs que ya no existen).

Ejecuta SIEMPRE:
```bash
docker compose restart backend celery_worker celery_beat
```

### 18.4. Resumen: Bloque Rápido de Actualización (Copy-Paste)

Si un desarrollador modificó las reglas en `backend/app/seeds/notification_rules.py` y subió los cambios a GitHub, **estos son los 4 comandos exactos que debes copiar, pegar y ejecutar en la consola del Droplet** para aplicar los cambios a las usuarias y evitar dolores de cabeza con el cache o rutas de Docker:

```bash
cd /opt/appgynsys
git pull origin main
docker compose exec backend bash -c 'cd /app && PYTHONPATH=/app python scripts/force_clean.py'
docker compose restart backend celery_worker celery_beat
```
