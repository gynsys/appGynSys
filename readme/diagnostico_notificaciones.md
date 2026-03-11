# Diagnóstico de Notificaciones (Persistente)

Este documento centraliza el proceso de depuración del sistema de notificaciones para evitar repetir investigaciones desde cero.

## 🛠 Herramientas de Diagnóstico
El script principal se encuentra en `readme/diagnose_appointments.py` (Local) y en `/app/diagnose_appointments.py` (Docker).

**Comando para ejecutar el diagnóstico (SaaS Multi-inquilino):**
```bash
python ssh_runner.py "docker exec appgynsys-backend-1 bash -c 'PYTHONPATH=/app python /app/diagnose_appointments.py <doctor_id> <tipo_notificacion>'"
```

**Ejemplos de tipos:**
- `doctor_new_appointment`
- `doctor_preconsulta_completed`
- `doctor_new_contact_message`
- `doctor_new_online_consultation`
- `doctor_daily_agenda`

**Lo que hace el script:**
1. Verifica si la regla existe y está activa en la base de datos para ese inquilino.
2. Verifica si la regla está definida en el nuevo `doctor_registry.py`.
3. Prueba la evaluación de la lógica técnica.
4. Intenta un disparo real y verifica si se crea la entrada en `pending_notifications`.

## 🔍 Puntos de Verificación Comunes

1.  **Reglas del Inquilino**: Cada doctor debe tener sus propias reglas (`tenant_id`). Si el doctor es nuevo o se resetearon las reglas, puede que falten las de tipo `doctor_new_appointment`.
2.  **Estado de Celery**: Las notificaciones se procesan de forma asíncrona. Si el worker está caído o Redis lleno, no saldrán.
3.  **Caché de Reglas**: El sistema cachea las reglas globales. Cambios manuales en la DB requieren:
    ```bash
    docker compose restart backend celery_worker celery_beat
    ```

## 📋 Historial de Problemas Detectados
- **2026-03-11**: Investigando falla de notificación de cita para inquilino.
