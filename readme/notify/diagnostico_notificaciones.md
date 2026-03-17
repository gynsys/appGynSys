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

## 🧠 Lógica de Notificaciones (Actualizada 2026-03-16)

A partir de marzo de 2026, el sistema se simplificó para garantizar estabilidad en un entorno SaaS multiusuario:

1.  **Fuente Única de Verdad (Single Source of Truth)**: Se eliminaron las reglas específicas por doctor (`tenant_id`). Ahora **todas** las notificaciones usan las plantillas globales administradas por el Super Admin.
2.  **Sincronización Push/Email**: Las notificaciones Push ahora heredan automáticamente el texto de la plantilla de Email (limpiando tags HTML) si no hay un texto plano específico. Esto evita que la App muestre mensajes viejos mientras el correo muestra los nuevos.
3.  **Variables Dinámicas**: Aunque la plantilla es global, variables como `{doctor_name}`, `{patient_name}`, etc., se llenan en tiempo real según el inquilino que dispara el evento.

## 🔍 Puntos de Verificación Críticos

1.  **Reglas Globales**: Verificar que el cambio se hizo en la regla con `tenant_id IS NULL` en la tabla `notification_rules`.
2.  **Suscripciones**: Si no hay suscripciones activas (verificable con `--subs-only`), el usuario NUNCA recibirá push.
3.  **Cierre de Sesión**: Si un cambio de texto no se refleja en la App pero sí en el servidor, pedir al médico que cierre sesión y vuelva a entrar para refrescar el token de vinculación.

- **2026-03-16**: **Conflicto "Mi Ciclo" vs Doctor**. Se detectó que si un médico usa el mismo dispositivo para loguearse como paciente en la App "Mi Ciclo", el token de push se reasigna al `user_id` del paciente y se elimina el `doctor_id`. 
    - **Síntoma**: El médico deja de recibir notificaciones en ese teléfono.
    - **Solución**: Cerrar sesión en "Mi Ciclo" y volver a entrar como Doctor. Para prevenir esto, se recomienda no usar cuentas de paciente en dispositivos de trabajo médico o alternar sesiones con precaución.
- **2026-03-15**: Falla crítica tras reinicio de Droplet...
- **2026-03-12**: Investigando falla masiva en APK. Se detectó falta de columna `token` en producción y error 500 en auditoría. Solucionado.
