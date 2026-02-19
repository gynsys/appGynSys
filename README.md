# GynSys - SaaS Multi-Inquilino para Clínicas Digitales

GynSys es una plataforma integral para la gestión de clínicas digitales, diseñada para ofrecer a médicos herramientas potentes de administración, comunicación y marketing en un entorno multi-inquilino.

## 🏗️ Stack Tecnológico Moderno

- **Backend**: FastAPI (Python) gestionado con `uv`.
- **Frontend**: React + Vite gestionado con `pnpm`.
- **Base de Datos**: PostgreSQL 15.
- **Caché/Colas**: Redis + Celery.
- **Infraestructura**: Docker & Docker Compose.

## 📁 Estructura del Proyecto

```
appgynsys/
├── backend/          # API FastAPI (con scripts de Python y configuración)
├── frontend/         # SPA React (UI del sistema)
├── docs/             # Manuales, logs y documentación detallada
├── scripts/          # Scripts de utilidad (.bat, .ps1) para inicio rápido
├── backups/          # Respaldos automáticos de la BD y archivos
├── docker-compose.yml # Orquestación de contenedores
└── README.md         # Este archivo
```

## 🚀 Inicio Rápido (Recomendado)

La forma más sencilla de ejecutar el sistema es utilizando **Docker**.

### Prerrequisitos
- Docker Desktop instalado y corriendo.

### Ejecución
1. En la raíz del proyecto:
   ```bash
   docker-compose up --build
   ```
2. Accede a los servicios:
   - **Frontend**: `http://localhost:5173`
   - **Backend API**: `http://localhost:8000`
   - **Documentación API**: `http://localhost:8000/docs`

---

## 🛠️ Desarrollo Manual (Sin Docker)

Si prefieres correr los servicios individualmente en tu máquina local:

### 1. Backend (Python/FastAPI)
Requiere [uv](https://github.com/astral-sh/uv) para gestión de paquetes.

```bash
cd backend
# Crear entorno virtual e instalar dependencias
uv pip install -r requirements.txt
# Activar entorno
.venv\Scripts\activate
# Iniciar servidor
uvicorn app.main:app --reload
```

### 2. Frontend (React/Vite)
Requiere [pnpm](https://pnpm.io/) para gestión de paquetes.

```bash
cd frontend
# Instalar dependencias
pnpm install
# Iniciar servidor de desarrollo
pnpm dev
```

---

## 🛡️ Sistema de Respaldos

El sistema cuenta con una estrategia de respaldo de doble capa para proteger la base de datos **PostgreSQL** y los archivos subidos (`uploads/`).

### Automático
Un servicio interno genera respaldos horarios en la carpeta `backend/backups/`.

### Manual (Script)
Ejecuta el script para generar un archivo `.zip` completo (BD + Imágenes):
```powershell
.\backend\backup_pg.ps1
```
*Tip: Puedes automatizar esto con el Programador de Tareas de Windows usando `backend/setup_auto_backup.bat`.*

---

## 🎯 Características Activas

### Gestión Médica
- **Panel Administrativo**: Dashboard completo para gestión de pacientes y citas.
- **Historias Médicas**: Registro digital de expedientes.
- **Agenda**: Gestión de citas y horarios.

### Perfil Público (Marketing)
- **Sitio Web del Doctor**: `app.gynsys.com/dr/{slug}`.
- **Blog Médico**: CMS integrado para publicar artículos.
- **Galería y Testimonios**: Secciones autoadministrables.

### Herramientas para Pacientes
- **Predictor de Ciclos**: Modal integrado para seguimiento de salud menstrual.
- **Pre-consulta**: Formularios digitales previos a la visita.

## 📄 Licencia
Este proyecto es privado y propietario.

## 🏗️ Infraestructura de Producción (DigitalOcean)

Esta sección documenta los detalles críticos del despliegue en producción para facilitar el mantenimiento.

- **Servidor (IP):** `167.172.115.154`
- **Usuario SSH:** `root`
- **Ubicación App:** `/opt/appgynsys`
- **Orquestación:** Docker Compose

### Servicios Activos
| Servicio | Contenedor | Puerto Interno | Propósito |
| :--- | :--- | :--- | :--- |
| **Backend** | `appgynsys-backend-1` | 8000 | API Principal |
| **Base de Datos**| `appgynsys-db-1` | 5432 | PostgreSQL 15 |
| **Cola de Tareas**| `appgynsys-celery_{worker/beat}`| N/A | Envío de correos y notificaciones |
| **Cache** | `appgynsys-redis-1` | 6379 | Broker de Celery y Cache |

### Comandos de Mantenimiento (SSH)

**Limpieza de Datos de Prueba (Mi Ciclo):**
```bash
ssh root@167.172.115.154 "docker exec appgynsys-db-1 psql -U postgres -d gynsys -c 'TRUNCATE cycle_logs, symptom_logs, pregnancy_logs, cycle_notification_settings, push_subscriptions, notification_logs CASCADE; DELETE FROM cycle_users; DELETE FROM patients;'"
```

**Reinicio de Servicios:**
```bash
ssh root@167.172.115.154 "cd /opt/appgynsys && docker compose restart backend celery_worker"
```

Para más detalles, consultar el archivo [`INFRASTRUCTURE_MAP.md`](./INFRASTRUCTURE_MAP.md) en la raíz.
