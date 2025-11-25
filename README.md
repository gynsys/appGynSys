# GynSys - SaaS Multi-Inquilino para Clínicas Digitales

GynSys es una plataforma SaaS que permite a médicos crear y gestionar sus propias "Clínicas Digitales" personalizables con herramientas integradas para citas, blog médico y pre-consultas.

## 🏗️ Arquitectura

Este es un **monorepo** que contiene:

- **Backend**: API RESTful construida con FastAPI
- **Frontend**: SPA construida con React y Vite

## 📁 Estructura del Proyecto

```
appgynsys/
├── backend/          # Proyecto FastAPI
│   ├── app/          # Código de la aplicación
│   ├── alembic/      # Migraciones de base de datos
│   └── requirements.txt
│
└── frontend/         # Proyecto React
    ├── src/          # Código fuente
    └── package.json
```

## 🚀 Inicio Rápido

### Backend

1. **Navegar al directorio backend:**
```bash
cd backend
```

2. **Crear entorno virtual:**
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

3. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

4. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

5. **Ejecutar migraciones:**
```bash
alembic upgrade head
```

6. **Iniciar servidor:**
```bash
uvicorn app.main:app --reload
```

El servidor estará disponible en `http://localhost:8000`

### Frontend

1. **Navegar al directorio frontend:**
```bash
cd frontend
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con la URL de la API
```

4. **Iniciar servidor de desarrollo:**
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5173`

## 📚 Documentación

- **Backend API Docs**: `http://localhost:8000/docs` (Swagger UI)
- **Backend README**: Ver `backend/README.md`
- **Frontend README**: Ver `frontend/README.md`

## 🎯 Características Principales

### Para Médicos (Inquilinos)
- ✅ Registro y autenticación (Email/Password y Google OAuth)
- ✅ Perfil personalizable (logo, colores)
- ✅ URL única por médico (`app.gynsys.com/dr/{slug}`)
- ✅ Dashboard privado para gestión

### Para Pacientes
- ✅ Visualización de perfil público del médico
- ✅ Agendamiento de citas (próximamente)
- ✅ Formularios de pre-consulta (próximamente)
- ✅ Blog médico (próximamente)

## 🛠️ Stack Tecnológico

### Backend
- FastAPI
- SQLAlchemy + Alembic
- Celery + Redis
- JWT Authentication
- Pydantic

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- Zustand

## 📝 Estado del Proyecto

### ✅ Completado
- Estructura base del proyecto
- Configuración de backend y frontend
- Modelos de base de datos (Doctor, Appointment, Patient)
- Endpoints de autenticación y perfiles
- Páginas públicas del frontend
- Sistema de autenticación JWT

### 🚧 En Desarrollo
- Gestión completa de citas
- Sistema de blog con IA
- Formularios de pre-consulta
- Personalización avanzada

## 📄 Licencia

Este proyecto es privado y propietario.

