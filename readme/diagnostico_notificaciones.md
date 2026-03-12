# Diagnóstico de Notificaciones (Persistente)

Este documento centraliza el proceso de depuración del sistema de notificaciones para evitar repetir investigaciones desde cero.

## 🛠 Herramienta Unificada
El script principal se encuentra en `readme/diagnose_appointments.py`. Es una herramienta integral que verifica entorno, suscripciones, lógica de reglas y logs.

### 🚀 Cómo ejecutarlo (vía SSH)

**1. Diagnóstico Completo de un Inquilino (Recomendado):**
```bash
python ssh_runner.py "docker exec appgynsys-backend-1 python scripts/diagnose_appointments.py --doc-id <id> --type <tipo>"
```

**2. Ver solo suscripciones de un usuario/doctor:**
```bash
python ssh_runner.py "docker exec appgynsys-backend-1 python scripts/diagnose_appointments.py --subs-only --email <email>"
```

**3. Ver logs recientes de un doctor:**
```bash
python ssh_runner.py "docker exec appgynsys-backend-1 python scripts/diagnose_appointments.py --logs-only --doc-id <id>"
```

### 📋 Tipos de Notificación Comunes:
- `doctor_new_appointment`
- `doctor_preconsulta_completed`
- `doctor_new_contact_message`
- `doctor_new_online_consultation`
- `doctor_daily_agenda`

## 🔍 Puntos de Verificación Críticos

1.  **Reglas del Inquilino**: Cada doctor debe tener sus propias reglas (`tenant_id`). 
2.  **Suscripciones**: Si no hay suscripciones en el comando `--subs-only`, el usuario NUNCA recibirá push.
3.  **Esquema de BD**: La columna `token` debe existir en `push_subscriptions` para dispositivos móviles (Capacitor).

## 📋 Historial de Problemas Detectados
- **2026-03-12**: Investigando falla masiva en APK. Se detectó falta de columna `token` en producción y error 500 en auditoría. Solucionado.
- **2026-03-11**: Investigando falla de notificación de cita para inquilino.
