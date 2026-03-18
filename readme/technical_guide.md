# Guía Técnica de Operaciones: GynSys SaaS

Esta guía documenta los componentes críticos, comandos y flujos lógicos del sistema para facilitar el mantenimiento futuro y el escalado de la plataforma.

## 🚀 Infraestructura y Servidores (Producción)

GynSys opera sobre una arquitectura de contenedores orquestada por Docker Compose en DigitalOcean.

- **Servidor Primario:** `167.172.115.154` (Ubuntu 22.04)
- **Usuario SSH:** `root`
- **Ruta del Proyecto:** `/opt/appgynsys`
- **Frontend (SaaS):** [Netlify](https://app.netlify.com/) (Desplegado desde `main`)

### 📦 Mapa de Servicios y Contenedores
| Servicio | Contenedor | Propósito | Puerto |
| :--- | :--- | :--- | :--- |
| **API Backend** | `appgynsys-backend-1` | FastAPI & Logic | 8000 |
| **Base de Datos** | `appgynsys-db-1` | PostgreSQL 15 | 5432 |
| **Cache & Broker** | `appgynsys-redis-1` | Autenticación & Celery | 6379 |
| **Worker** | `appgynsys-celery_worker-1` | Tareas de Email/Push | N/A |
| **Scheduler** | `appgynsys-celery_beat-1` | Tareas Programadas | N/A |
| **Object Storage**| `appgynsys-minio-1` | Imágenes y Documentos | 9001 |

## 🗄️ Base de Datos: Estructura y Mantenimiento

- **Motor:** PostgreSQL 15 (Base: `gynsys`)
- **Archivos de Modelos:** `backend/app/db/models/`
- **Configuración Global:** [config.py](./backend/app/core/config.py)
- **Entornos Externos:** [backend/.env](./backend/.env)

### 📊 Tablas y Relaciones Críticas
| Tabla | Categoría | Propósito / Notas |
| :--- | :--- | :--- |
| `doctors` | Identidad | Inquilinos (Tenants). Columna `is_active` controla login. |
| `patients` | Clínica | Datos maestros del paciente. |
| `appointments` | Clínica | Citas. Columna `appointment_date` (DateTime aware). |
| `cycle_users` | Mi Ciclo | Usuarias finales de la APP de seguimiento. |
| `notification_logs`| Sistema | Histórico de mensajes enviados (`doctor_id` opcional). |

---

## 🤖 Asistente Virtual (Notificaciones Inteligentes)

El sistema cuenta con un motor de evaluación diaria que analiza el contexto de cada doctora y paciente para enviar recordatorios automáticos.

### 👩‍⚕️ Notificaciones para Doctoras (Administrativas)
Definidas en `backend/app/services/notifications/registry.py`:

| Tipo | Hora | Lógica / Condición |
| :--- | :--- | :--- |
| **Resumen Matutino** | 07:30 AM | Envía el conteo de citas de hoy y la hora de la 1era cita. |
| **Historias Pendientes** | 08:00 PM | Alerta si hay citas pasadas hoy marcadas como `confirmed`. |
| **Agenda Baja** | Viernes 5:00 PM | Alerta si la ocupación de la próxima semana es < 30%. |

### 🤰 Notificaciones para Pacientes (Recordatorios)
| Tipo | Tiempo | Detalles |
| :--- | :--- | :--- |
| **Cita T-90** | 1h 30m antes | Recordatorio push/email de cita inminente. |
| **Control Menstrual** | Diario | Basado en el `cycle_day` de la paciente. |

---

## 🛠️ Comandos SSH de Mantenimiento

### Despliegue y Reinicio
```bash
# Actualizar y reconstruir (Uso estándar)
cd /opt/appgynsys && git pull origin main && docker compose build backend celery_worker && docker compose up -d
```

### Gestión de Base de Datos (PostgreSQL)
```bash
# Entrar a consola SQL
docker exec -it appgynsys-db-1 psql -U postgres -d gynsys

# Limpieza total de datos de prueba (Mi Ciclo)
docker exec appgynsys-db-1 psql -U postgres -d gynsys -c 'TRUNCATE cycle_logs, symptom_logs, pregnancy_logs, cycle_notification_settings, push_subscriptions, notification_logs CASCADE; DELETE FROM cycle_users; DELETE FROM patients;'
```

### Diagnóstico de Logs
```bash
# Ver errores de la API en vivo
docker logs -f appgynsys-backend-1

# Ver envío de correos y tareas Celery
docker logs -f appgynsys-celery_worker-1
```

## ⚠️ Resolución de Problemas (Troubleshooting)

### 1. Error de Conexión a DB ("db" not found)
Ocurre si se intenta correr un script desde el host sin Docker. 
**Solución:** Ejecutar siempre dentro del contenedor: `docker exec -it appgynsys-backend-1 python scripts/tuscript.py`.

### 2. Notificaciones no se envían
- Verificar `celery_beat` (esta tarea programa las alertas).
- Revisar `vapid_private.pem` en el backend para Push Notifications.
- Ver `notification_logs` para ver si falló el canal (Push/Email).

## 💡 Lecciones Aprendidas y Mejores Prácticas

### 1. Manejo de Fechas (Timezones)
El sistema utiliza fechas "aware" (con zona horaria) para las citas. Al comparar con `datetime.now()`, siempre usar `normalize_to_caracas()` del servicio de notificaciones para evitar errores de comparación entre fechas ingenuas y conscientes.

### 2. Migraciones Robustas en Producción
Si una migración de SQLAlchemy falla por discrepancias de entorno (Docker vs Host), utilizar comandos directos de PostgreSQL vía `docker exec appgynsys-db-1 psql`. Es el método más seguro para añadir columnas sin bloquear el sistema.

### 3. Notificaciones Multi-Actor
El procesador de notificaciones ya es agnóstico. Puede enviar mensajes a `CycleUser` o `Doctor`. Al añadir nuevas reglas, asegurar que el `context_generator` maneje el tipo de actor correspondiente.

### 4. Arquitectura de Plantillas (Notificaciones)
Para que una notificación sea válida, debe tener tanto `message_template` (HTML) como `message_text_template` (Texto plano). El motor prioriza el HTML pero requiere el texto plano como fallback para notificaciones Push. Si el cuerpo llega vacío, verifica que la clase `_RuleData` en `registry.py` incluya ambos campos.

### 5. Interfaz de Gestión (Admin)
El listado de notificaciones en el panel administrativo muestra el **Título Real** del mensaje como identificador principal. Esto permite validar la claridad del mensaje hacia la paciente sin necesidad de abrir el editor.

---
> [!TIP]
> Toda la configuración de Google OAuth y Whitelist de correos se gestiona en `settings.GOOGLE_WHITE_LIST`.
