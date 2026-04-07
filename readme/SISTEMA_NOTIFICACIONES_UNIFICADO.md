# Sistema de Notificaciones GyNSys SaaS - Documentación Técnica Unificada

Este documento consolida la arquitectura, el flujo de trabajo y las estrategias de diagnóstico para el sistema de notificaciones de GyNSys (SaaS y Mi Ciclo).

## 1. Arquitectura del Sistema

El sistema está diseñado para ser resiliente y escalable, operando en tres capas principales:

### A. Capa de Expansión (Generación)
- **Localización**: `backend/app/tasks/campaigns.py` y `backend/app/tasks/notifications.py`.
- **Funcionamiento**: Cuando se dispara un evento (campaña, recordatorio de cita, aviso de ciclo), se crea un registro en la tabla `pending_notifications`.
- **Snapshot de Resiliencia**: Se almacena el `recipient_email_direct` para asegurar que el mensaje llegue al destino original incluso si el perfil del usuario cambia.

### B. Capa de Cola (Programación)
- **Celery Beat**: Escanea la tabla `pending_notifications` cada 60 segundos.
- **Estado**: Las notificaciones pasan de `pending` -> `processing` -> `sent` (o `failed`).

### C. Capa de Entrega (Transporte)
- **Localización**: `backend/app/services/notifications/sender.py`.
- **Canal Dual**: El sistema intenta enviar por **Push** (vía Firebase/Capacitor) y **Email** (vía Resend/SMTP).
- **Éxito**: Si cualquiera de los dos canales tiene éxito, la notificación se marca como `sent`.

---

## 2. Tipos de Notificaciones y Reglas

### Método del Ritmo (Mi Ciclo)
Se disparan exactamente **10 notificaciones** por ciclo:
- **Días Post-Periodo (5)**: `rhythm_after_period_1` a `5`.
- **Días Pre-Periodo (5)**: `rhythm_before_period_5` a `1`.

### Notificaciones de Doctores
- `doctor_new_appointment`: Nueva cita agendada.
- `doctor_preconsulta_completed`: Pre-consulta terminada por el paciente.
- `doctor_daily_agenda`: Resumen diario de agenda (06:00 AM).

---

## 3. Diagnóstico de Fallas Comunes

### A. "La Sombra del Doctor" (Desvío de Correo)
- **Falla**: Notificaciones de pacientes llegan al correo del doctor.
- **Causa**: Fallo en la jerarquía de resolución de destinatarios o fallback administrativo mal configurado.
- **Solución**: Se implementó una **Jerarquía Estricta**: Snapshot Email > Perfil Usuario > Admin (solo para alertas de sistema).

### B. Notificaciones con Cuerpo Vacío
- **Síntoma**: Llega la alerta pero no se ve el mensaje.
- **Diagnóstico**: Si se aplicó un parche a la BD después de que las notificaciones se encolaron (04:00 AM), la cola tiene datos viejos.
- **Reparación**: Usar `repair_pending_bodies.py` en el servidor.

### C. Conflictos de Identidad (Push)
- **Situación**: Un doctor usa su App para registrarse como paciente en "Mi Ciclo".
- **Efecto**: El token de Push se vincula al `user_id` del paciente, y el doctor deja de recibir alertas médicas en ese dispositivo.
- **Solución**: Cerrar sesión en Mi Ciclo y re-entrar como Doctor para restaurar la vinculación.

---

## 4. Herramientas de Depuración en el Servidor (VPS)

### Ejecución de Diagnóstico Unificado:
```bash
python ssh_runner.py "docker exec appgynsys-backend-1 python3 app/scripts/diagnose_notifications.py --email <usuario@correo.com>"
```

### Script de Reparación de Cola:
```bash
python ssh_runner.py "docker exec appgynsys-backend-1 python3 app/scripts/repair_pending_bodies.py"
```

---
*Ultima actualización: 2026-04-07*
