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

1. **Crear entorno virtual (solo la primera vez):**
```bash
python -m venv .venv
# Activar en Linux/macOS:
source .venv/bin/activate
# Activar en Windows:
.venv\Scripts\activate
```

2. **Instalar dependencias (usando uv):**
```bash
uv pip sync --system --require-hashes requirements.lock
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
├── pyproject.toml
├── requirements.lock
└── requirements.txt
```


## Desarrollo

### Agregar o actualizar dependencias:
Edita `pyproject.toml` y luego ejecuta:
```bash
uv pip compile
```
Esto actualizará `requirements.lock` para entornos reproducibles.

### Crear una nueva migración:
```bash
alembic revision --autogenerate -m "descripción del cambio"
alembic upgrade head
```

### Ejecutar Celery Worker:
```bash
celery -A app.tasks.celery_app worker --loglevel=info
```

