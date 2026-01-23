# 📚 Documentación Completa - GynSys

## 🎯 Estado del Proyecto

**Fecha de Documentación:** 22 de Noviembre, 2025  
**Estado:** Desarrollo en Progreso - Funcionalidades Core Implementadas

---

## 📋 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Backend - FastAPI](#backend---fastapi)
3. [Frontend - React](#frontend---react)
4. [Base de Datos](#base-de-datos)
5. [Funcionalidades Implementadas](#funcionalidades-implementadas)
6. [Estructura de Directorios](#estructura-de-directorios)
7. [Configuración y Setup](#configuración-y-setup)
8. [Endpoints API](#endpoints-api)
9. [Próximos Pasos](#próximos-pasos)

---

## 🏗️ Arquitectura General

### Stack Tecnológico
- **Backend:** FastAPI (Python)
- **Frontend:** React + Vite + Tailwind CSS
- **Base de Datos:** SQLite (desarrollo) / PostgreSQL (producción)
- **ORM:** SQLAlchemy
- **Migraciones:** Alembic
- **Autenticación:** JWT
- **Estado Global:** Zustand
- **HTTP Client:** Axios

### Modelo Multi-Tenant
- Cada médico es un "tenant" con su propia URL: `app.gynsys.com/dr/{slug}`
- Personalización por médico: logo, foto, colores, biografía
- Contenido independiente: testimonios, galería, citas

---

## 🔧 Backend - FastAPI

### Ubicación
```
C:\Users\pablo\Desktop\appgynsys\backend\
```

### Estructura Principal
```
backend/
├── app/
│   ├── main.py                 # Punto de entrada FastAPI
│   ├── core/
│   │   ├── config.py          # Configuración (Pydantic Settings)
│   │   └── security.py        # JWT, hashing passwords
│   ├── db/
│   │   ├── base.py            # SQLAlchemy Base, get_db
│   │   └── models/
│   │       ├── doctor.py      # Modelo Doctor
│   │       ├── appointment.py  # Modelo Appointment
│   │       ├── patient.py      # Modelo Patient
│   │       ├── testimonial.py # Modelo Testimonial
│   │       └── gallery.py     # Modelo GalleryImage
│   ├── schemas/
│   │   ├── doctor.py          # Schemas Pydantic Doctor
│   │   ├── appointment.py     # Schemas Appointment
│   │   ├── token.py           # Schemas JWT
│   │   ├── testimonial.py     # Schemas Testimonial
│   │   └── gallery.py         # Schemas Gallery
│   ├── api/
│   │   └── v1/
│   │       ├── api.py         # Router principal
│   │       └── endpoints/
│   │           ├── auth.py    # /auth (login, register, OAuth)
│   │           ├── profiles.py # /profiles/{slug} (público)
│   │           ├── users.py   # /users/me (autenticado)
│   │           ├── appointments.py # /appointments
│   │           ├── uploads.py  # /uploads (logo, photo)
│   │           ├── testimonials.py # /testimonials
│   │           └── gallery.py  # /gallery
│   └── tasks/                 # Celery tasks (futuro)
├── alembic/                   # Migraciones
├── alembic.ini
├── requirements.txt
└── uploads/                   # Archivos subidos
    ├── logos/
    ├── photos/
    └── gallery/
```

### Variables de Entorno
Crear archivo `.env` en `backend/`:
```env
DATABASE_URL=sqlite:///./gynsys.db
SECRET_KEY=tu-secret-key-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=5242880
```

### Comandos Backend
```powershell
# Activar entorno virtual
C:\Users\pablo\Desktop\gynsys\venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Crear migración
alembic revision --autogenerate -m "descripcion"

# Aplicar migraciones
alembic upgrade head

# Iniciar servidor
uvicorn app.main:app --reload
```

---

## 🎨 Frontend - React

### Ubicación
```
C:\Users\pablo\Desktop\appgynsys\frontend\
```

### Estructura Principal
```
frontend/
├── src/
│   ├── main.jsx              # Punto de entrada
│   ├── App.jsx               # Router principal
│   ├── index.css             # Estilos globales Tailwind
│   ├── pages/
│   │   ├── LandingPage.jsx   # Marketing GynSys.com
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DoctorProfilePage.jsx # Clínica Digital (/dr/:slug)
│   │   ├── DashboardOverviewPage.jsx
│   │   ├── ProfileEditorPage.jsx # /dashboard/profile
│   │   └── NotFoundPage.jsx
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Spinner.jsx
│   │   ├── layout/
│   │   │   └── Navbar.jsx    # Navbar para perfil médico
│   │   └── features/
│   │       ├── AppointmentModal.jsx
│   │       ├── TestimonialsSection.jsx
│   │       ├── GallerySection.jsx
│   │       └── FileUpload.jsx
│   ├── services/
│   │   ├── authService.js
│   │   ├── doctorService.js
│   │   ├── appointmentService.js
│   │   ├── testimonialService.js
│   │   └── galleryService.js
│   ├── store/
│   │   └── authStore.js      # Zustand store
│   ├── lib/
│   │   └── axios.js          # Instancia Axios configurada
│   └── hooks/
│       └── useAuth.js        # Hook de autenticación
├── package.json
├── tailwind.config.js
├── vite.config.js
└── index.html
```

### Comandos Frontend
```powershell
# Instalar dependencias
npm install

# Iniciar servidor desarrollo
npm run dev

# Build producción
npm run build
```

### Variables de Entorno Frontend
Crear archivo `.env` en `frontend/`:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 🗄️ Base de Datos

### Modelos Implementados

#### 1. Doctor (doctors)
- `id` (PK)
- `email` (único)
- `password_hash`
- `nombre_completo`
- `especialidad`
- `biografia`
- `slug_url` (único, para URL)
- `logo_url`
- `photo_url`
- `theme_primary_color`
- `is_active`
- `is_verified`
- `created_at`, `updated_at`

#### 2. Appointment (appointments)
- `id` (PK)
- `doctor_id` (FK)
- `patient_name`
- `patient_email`
- `patient_phone`
- `appointment_date`
- `appointment_type`
- `notes`
- `status`
- `created_at`, `updated_at`

#### 3. Patient (patients)
- Modelo básico (pendiente desarrollo)

#### 4. Testimonial (testimonials)
- `id` (PK)
- `doctor_id` (FK)
- `patient_name`
- `patient_email`
- `content`
- `rating` (1-5)
- `is_approved`
- `is_featured`
- `created_at`, `updated_at`

#### 5. GalleryImage (gallery_images)
- `id` (PK)
- `doctor_id` (FK)
- `image_url`
- `title`
- `description`
- `display_order`
- `is_active`
- `created_at`, `updated_at`

### Migraciones
- ✅ `de860ca5a7c9_initial_migration.py` - Tablas iniciales
- ✅ `bf4483cce40d_add_photo_url_to_doctors.py` - Campo photo_url
- ✅ `575d57183e98_add_testimonials_and_gallery_tables.py` - Testimonios y Galería

---

## ✨ Funcionalidades Implementadas

### ✅ Autenticación
- [x] Registro de médicos (email/password)
- [x] Login (JWT)
- [x] Google OAuth (endpoints creados, pendiente frontend)
- [x] Protección de rutas
- [x] Interceptor Axios para JWT

### ✅ Perfil Público del Médico
- [x] Página pública: `/dr/{slug}`
- [x] Navbar con logo y nombre del médico
- [x] Sección "Sobre Mí" con foto y biografía
- [x] Sección de Servicios
- [x] Sección de Testimonios (diseño moderno con cards)
- [x] Sección de Galería (grid con lightbox)
- [x] Personalización de colores
- [x] Footer

### ✅ Gestión de Perfil (Dashboard)
- [x] Editar perfil: `/dashboard/profile`
- [x] Subir logo
- [x] Subir foto de perfil
- [x] Editar biografía
- [x] Cambiar color primario
- [x] Actualizar nombre y especialidad

### ✅ Citas (Appointments)
- [x] Endpoint público para crear citas
- [x] Modal de agendamiento
- [x] Formulario completo
- [x] Validación de fechas

### ✅ Testimonios
- [x] Endpoint público para ver testimonios aprobados
- [x] Endpoint público para crear testimonios
- [x] Endpoints autenticados para gestionar (CRUD)
- [x] Sistema de rating (estrellas)
- [x] Testimonios destacados
- [x] Diseño moderno: foto arriba, comentario abajo

### ✅ Galería
- [x] Endpoint público para ver galería
- [x] Subir imágenes
- [x] Título y descripción
- [x] Orden personalizable
- [x] Lightbox modal
- [x] Grid responsive

### ⏳ Pendiente
- [ ] Dashboard completo (estadísticas, citas, etc.)
- [ ] Blog con IA
- [ ] Formularios de pre-consulta
- [ ] Notificaciones por email (Celery)
- [ ] Google OAuth frontend
- [ ] Gestión de testimonios desde dashboard
- [ ] Gestión de galería desde dashboard

---

## 🔌 Endpoints API

### Autenticación (`/api/v1/auth`)
- `POST /token` - Login (email/password)
- `POST /register` - Registro
- `GET /login/google` - Iniciar OAuth Google
- `GET /login/google/callback` - Callback OAuth

### Perfiles (`/api/v1/profiles`)
- `GET /{slug}` - Perfil público del médico

### Usuarios (`/api/v1/users`)
- `GET /me` - Info del usuario autenticado
- `PUT /me` - Actualizar perfil

### Citas (`/api/v1/appointments`)
- `POST /public` - Crear cita (público)
- `POST /` - Crear cita (autenticado)
- `GET /` - Listar citas (autenticado)
- `PUT /{id}` - Actualizar cita
- `DELETE /{id}` - Eliminar cita

### Uploads (`/api/v1/uploads`)
- `POST /logo` - Subir logo (autenticado)
- `POST /photo` - Subir foto (autenticado)

### Testimonios (`/api/v1/testimonials`)
- `GET /public/{doctor_slug}` - Testimonios públicos
- `POST /` - Crear testimonio (público)
- `GET /` - Listar testimonios del médico (autenticado)
- `PUT /{id}` - Actualizar testimonio
- `DELETE /{id}` - Eliminar testimonio

### Galería (`/api/v1/gallery`)
- `GET /public/{doctor_slug}` - Galería pública
- `POST /upload` - Subir imagen (autenticado)
- `GET /` - Listar imágenes del médico (autenticado)
- `PUT /{id}` - Actualizar imagen
- `DELETE /{id}` - Eliminar imagen

---

## 🚀 Configuración y Setup

### Requisitos Previos
- Python 3.11+
- Node.js 18+
- npm o yarn

### Setup Inicial Backend
```powershell
cd C:\Users\pablo\Desktop\appgynsys\backend

# Activar venv (usar el de gynsys)
C:\Users\pablo\Desktop\gynsys\venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Aplicar migraciones
alembic upgrade head

# Iniciar servidor
uvicorn app.main:app --reload
```

### Setup Inicial Frontend
```powershell
cd C:\Users\pablo\Desktop\appgynsys\frontend

# Instalar dependencias
npm install

# Iniciar servidor
npm run dev
```

### Scripts Disponibles
- `backend/start_backend.bat` - Inicia backend
- `frontend/start_frontend.bat` - Inicia frontend
- `frontend/REINICIAR_MANUAL.bat` - Reinicia frontend limpiamente

---

## 📝 Notas Importantes

### Rutas de Archivos
- **Backend venv:** `C:\Users\pablo\Desktop\gynsys\venv\`
- **Proyecto backend:** `C:\Users\pablo\Desktop\appgynsys\backend\`
- **Proyecto frontend:** `C:\Users\pablo\Desktop\appgynsys\frontend\`

### Base de Datos
- Ubicación: `backend/gynsys.db` (SQLite)
- Migraciones: `backend/alembic/versions/`

### Archivos Subidos
- Logos: `backend/uploads/logos/`
- Fotos: `backend/uploads/photos/`
- Galería: `backend/uploads/gallery/`
- Servidos en: `http://localhost:8000/uploads/...`

### Problemas Conocidos
- Hot reload del frontend puede requerir recarga manual
- Si el frontend no actualiza: usar `REINICIAR_MANUAL.bat`
- Si el backend no inicia: verificar que el venv esté activado

---

## 🎯 Próximos Pasos

### Prioridad Alta
1. **Dashboard Completo**
   - Vista de citas (calendario)
   - Estadísticas
   - Gestión de testimonios
   - Gestión de galería

2. **Blog con IA**
   - Generación de artículos
   - Editor de contenido
   - Publicación

3. **Formularios Pre-consulta**
   - Crear modelo de formularios
   - Editor de formularios
   - Respuestas de pacientes

### Prioridad Media
4. **Notificaciones**
   - Configurar Celery
   - Emails de bienvenida
   - Recordatorios de citas

5. **Google OAuth Frontend**
   - Integrar botón de Google
   - Manejar callback

6. **Mejoras UX**
   - Loading states
   - Error handling mejorado
   - Validaciones frontend

### Prioridad Baja
7. **Testing**
   - Tests unitarios backend
   - Tests de integración
   - Tests E2E frontend

8. **Deployment**
   - Docker setup
   - CI/CD
   - Producción

---

## 📞 Contacto y Referencias

### Documentación Externa
- FastAPI: https://fastapi.tiangolo.com/
- React: https://react.dev/
- Tailwind CSS: https://tailwindcss.com/
- SQLAlchemy: https://www.sqlalchemy.org/

### Archivos de Referencia
- `BIografia_DRA_MARIEL.md` - Biografía ejemplo
- `COMO_SUBIR_FOTOS.md` - Guía de subida de archivos
- `CREAR_MIGRACION_TESTIMONIALS_GALLERY.md` - Guía de migraciones

---

**Última Actualización:** 22 de Noviembre, 2025  
**Versión:** 1.0.0-alpha

