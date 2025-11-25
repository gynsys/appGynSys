# GynSys Backend

Backend API para GynSys - SaaS multi-inquilino para clínicas digitales.

## Stack Tecnológico

- **FastAPI**: Framework web moderno y rápido
- **SQLAlchemy**: ORM para Python
- **Alembic**: Migraciones de base de datos
- **Celery + Redis**: Tareas asíncronas
- **Pydantic**: Validación de datos
- **JWT**: Autenticación

## Configuración Inicial

1. **Crear entorno virtual:**
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

2. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

3. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Ejecutar migraciones:**
```bash
cd backend
alembic upgrade head
```

5. **Iniciar servidor:**
```bash
uvicorn app.main:app --reload
```

El servidor estará disponible en `http://localhost:8000`

## Documentación API

Una vez iniciado el servidor, la documentación interactiva estará disponible en:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Estructura del Proyecto

```
backend/
├── app/
│   ├── api/           # Endpoints de la API
│   ├── core/          # Configuración y seguridad
│   ├── db/            # Base de datos y modelos
│   ├── schemas/       # Schemas Pydantic
│   └── tasks/         # Tareas de Celery
├── alembic/           # Migraciones
└── requirements.txt
```

## Desarrollo

### Crear una nueva migración:
```bash
alembic revision --autogenerate -m "descripción del cambio"
alembic upgrade head
```

### Ejecutar Celery Worker:
```bash
celery -A app.tasks.celery_app worker --loglevel=info
```

