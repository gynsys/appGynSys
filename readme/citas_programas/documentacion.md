# Funcionalidad: Próximas Citas Programadas con Recordatorios Automáticos

## 1. Descripción General
Esta funcionalidad permite a los médicos programar citas tentativas de seguimiento para sus pacientes directamente desde la página de consulta médica. El sistema calcula automáticamente la fecha de la próxima cita basándose en intervalos predefinidos y envía recordatorios automáticos (Email y Push) a través de Celery.

## 2. Arquitectura de Archivos

### Backend (FastAPI + SQLAlchemy + Celery)
| Archivo | Responsabilidad |
|---------|-----------------|
| `backend/app/db/models/scheduled_appointment.py` | Definición de la tabla `scheduled_appointments`. |
| `backend/app/schemas/scheduled_appointment.py` | Validaciones Pydantic para creación y respuesta. |
| `backend/app/crud/scheduled_appointment.py` | Lógica de base de datos (Create, Read, Update, Delete). |
| `backend/app/api/v1/endpoints/scheduled_appointments.py` | Rutas de la API (/scheduled-appointments/). |
| `backend/app/tasks/scheduled_appointment_reminders.py` | Tarea de Celery para envío de recordatorios. |
| `backend/app/templates/email/scheduled_reminder.html` | Plantilla HTML del correo de recordatorio. |

### Frontend (React + Tailwind + Vite)
| Archivo | Responsabilidad |
|---------|-----------------|
| `frontend/src/services/scheduledAppointmentService.js` | Cliente Axios para interactuar con la nueva API. |
| `frontend/src/features/doctor_consultation/pages/DoctorConsultationPage.jsx` | UI para programar la cita y lógica de guardado. |
| `frontend/src/features/campaigns/CampaignsPage.jsx` | Visualización y gestión de las citas programadas. |

## 3. Flujo Técnico

### Paso 1: Registro en Consulta
1. El médico marca el Checkbox "Programar próxima cita".
2. Selecciona un intervalo (ej: 3 meses).
3. El frontend calcula la fecha y permite notas adicionales.
4. Al guardar la consulta, se realiza un segundo POST a `/scheduled-appointments/`.

### Paso 2: Seguimiento y Gestión
1. En la pestaña de **Difusión**, aparece una nueva sub-pestaña "Próximas Citas".
2. Se listan las citas filtrando por `doctor_id`.
3. Se pueden marcar como completadas o cancelar.

### Paso 3: Recordatorios Automáticos
1. Celery corre una tarea diaria `check_upcoming_appointments`.
2. Busca citas `pending` con fecha programada en los próximos 1-3 días.
3. Envía notificaciones y marca `reminder_sent=True`.

## 4. Comandos en Servidor (Producción)
Dado que el sistema corre en un servidor remoto, todas las operaciones de backend y base de datos deben ejecutarse vía SSH.

### Usando `ssh_runner.py`
El script `ssh_runner.py` permite ejecutar comandos de forma segura en el servidor:

**Ejemplo: Crear migración de base de datos**
```powershell
python ssh_runner.py "cd /app/backend && alembic revision --autogenerate -m 'add scheduled_appointments table'"
```

**Ejemplo: Aplicar migración**
```powershell
python ssh_runner.py "cd /app/backend && alembic upgrade head"
```

**Ejemplo: Reiniciar Celery para cargar nuevas tareas**
```powershell
python ssh_runner.py "systemctl restart celery"
```

## 5. Problemas y Soluciones
| Problema | Solución |
|----------|----------|
| **CORS en notificaciones** | Las imágenes de los templates deben servirse desde una URL pública absoluta (`settings.API_URL`). |
| **Diferencia de Husos Horarios** | Usar siempre `DateTime(timezone=True)` en SQLAlchemy y `pytz.timezone('America/Caracas')` en Celery. |
| **Duplicidad de Citas** | Validar que no exista una cita pendiente (`pending`) para la misma consulta original antes de crear una nueva. |
