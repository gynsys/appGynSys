# Implementación de Sistema de Clínicas (Instituciones) y Gestión de Personal (Staff)

Este documento detalla todas las modificaciones realizadas para introducir los planes institucionales, cuentas de clínicas y gestión de médicos dependientes dentro del SaaS GynSys.

## 1. Cambios en la Base de Datos y Modelos (Backend)

### Archivos Modificados:
- `backend/app/db/models/plan.py`
- `backend/app/db/models/admin.py` (Schemas de Pydantic en `schemas/admin.py`)
- `backend/alembic/versions/20260528_add_max_staff_members.py` (Migración generada)
- `backend/alembic/versions/20260528_add_is_clinic_to_doctor.py` (Migración generada)

### Detalles Técnicos:
- Se añadió la columna `max_staff_members` a la tabla `plans`. Esto permite al Super Admin definir cuántos médicos adicionales puede crear un tenant según su plan contratado (ej. Plan Individual = 0, Plan Institucional = múltiples).
- Se añadió la columna booleana `is_clinic` a la tabla `doctors` (que modela a los tenants) para distinguir entre cuentas individuales y cuentas institucionales.
- Se refactorizaron las migraciones para utilizar `sa.inspect(bind)` en vez de `Inspector.from_engine`, resolviendo las advertencias de importación depreciada.

## 2. API Backend (`backend/app/api/v1`)

### Archivos Modificados:
- `backend/app/api/v1/endpoints/admin.py`
- `backend/app/api/v1/endpoints/staff.py`
- `backend/app/core/email.py`

### Detalles Técnicos:
- **Gestión de Planes y Tenants (`admin.py`)**: Los endpoints de creación/edición en `/admin/plans` y `/admin/tenants` ahora aceptan y validan los parámetros `max_staff_members` e `is_clinic`. Cuando `is_clinic` es `True`, se le asigna implícita/explícitamente un rol superior al inquilino que le permite registrar staff.
- **Validación del Cupo de Staff (`staff.py`)**: Antes de crear un nuevo miembro de personal (médico), la API cuenta cuántos médicos ya existen vinculados a la clínica y verifica que no superen el límite establecido por `plan.max_staff_members`. Si se excede, retorna un error 400.
- **Envío Automático de Credenciales (`staff.py` y `email.py`)**: Se implementó la lógica para que al crear un nuevo médico (staff), se genere una contraseña aleatoria y se envíe un email transaccional (`send_staff_invitation_email`) usando `BackgroundTasks` para no bloquear el request.

## 3. Frontend (React / Vite)

### Archivos Modificados:
- `frontend/src/App.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/pages/admin/AdminPlansPage.jsx`
- `frontend/src/pages/admin/AdminTenantsPage.jsx`
- `frontend/src/pages/LandingPage.jsx`

### Archivos Creados:
- `frontend/src/pages/dashboard/StaffManager.jsx`

### Detalles Técnicos:
- **Admin Dashboard (`AdminPlansPage` y `AdminTenantsPage`)**:
  - Se agregaron campos de tipo "number" para configurar `max_staff_members` al crear/editar un Plan.
  - Se agregaron campos de tipo "checkbox" para activar `is_clinic` al crear/editar un Inquilino.
- **Panel Institucional de la Clínica (`StaffManager.jsx`)**:
  - Nueva ruta en `/dashboard/staff` para los usuarios con el plan institucional.
  - Interfaz completa para visualizar un listado de médicos dependientes, con un modal para "Añadir Médico" (nombre, correo) y botones para eliminar acceso al staff.
- **Control de Permisos Visuales (`Sidebar.jsx`)**:
  - Se aplicó una regla `user?.role === 'staff'` para ocultar opciones irrelevantes a un médico empleado de la clínica. Los miembros de staff solo ven: *Gestión Citas, Historias Médicas, Preconsultas, Directorio, Editor de Informes*.
  - Menús de configuración avanzada (Preconsulta, PDF, Landing Page/Web) y Marketing (IA, Blog) quedaron restringidos al dueño de la clínica.
- **Rutas (`App.jsx`)**:
  - Importación y registro de `<Route path="staff" element={<StaffManager />} />` bajo el componente padre `DashboardLayout`.
- **Precios en Landing Page (`LandingPage.jsx`)**:
  - Refactorización de la sección "Plan Único" hacia un diseño de "Planes Múltiples". Se expuso el **Plan Médico ($19.99)** y el **Plan Institucional ($49.99)**. Se destacaron las funcionalidades (Gestión de Personal, Agendamiento Centralizado, etc.) específicas para clínicas.

## 4. Notas de Despliegue y Producción
- **Alembic**: Es crítico ejecutar `alembic upgrade head` en el servidor de base de datos antes de hacer pull de estos cambios en producción.
- **Email/SMTP**: Asegurar que las variables de entorno relacionadas con correos electrónicos (SMTP) estén correctamente configuradas en el `.env` del servidor de producción, de lo contrario la creación de Staff arrojará fallas al intentar enviar el email de invitación.
