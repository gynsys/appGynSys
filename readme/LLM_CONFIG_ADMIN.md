# GynSys — Configuración Dinámica de Proveedores LLM

## Propósito

Este documento describe la arquitectura, implementación y operación del sistema de configuración dinámica de modelos de lenguaje (LLMs) en GynSys.

Antes de esta implementación, las API keys de Gemini y Groq estaban hardcodeadas en `.env` y `config.py`, lo que impedía cambiarlas sin reiniciar los contenedores Docker. Ahora se gestionan desde el panel Super Admin en `/admin/llm-providers`.

---

## Arquitectura General

```
Super Admin UI (/admin/llm-providers)
        │
        ▼
POST/PUT /api/v1/admin/llm-providers/{id}
        │
        ▼
CRUD llm.py → cifra API key con Fernet → tabla llm_providers (PostgreSQL)
        │
        ▼
llm_router.py (cache TTL=5min)
        │
        ├── ai_service.py      (generación de artículos blog)
        └── social_service.py  (generación de Reels y Carruseles)
```

---

## Archivos Creados/Modificados

### Backend

| Archivo | Acción | Propósito |
|---------|--------|-----------|
| `app/db/models/llm_provider.py` | NUEVO | Modelo SQLAlchemy tabla `llm_providers` |
| `app/db/models/__init__.py` | MOD | Importar `LLMProvider` |
| `app/schemas/llm.py` | NUEVO | Schemas Pydantic (Create, Update, Response) |
| `app/crud/llm.py` | NUEVO | CRUD + cifrado Fernet de API keys |
| `app/services/llm_router.py` | NUEVO | Router unificado con fallback automático |
| `app/api/v1/endpoints/admin.py` | MOD | +5 endpoints `/admin/llm-providers` |
| `app/services/ai_service.py` | MOD | Delega a `llm_router` en vez de llamar Gemini directo |
| `app/services/social_service.py` | MOD | Delega a `llm_router` en vez de Gemini+Groq hardcoded |
| `app/seeds/seed_llm_providers.py` | NUEVO | Seed inicial desde variables `.env` |

### Frontend

| Archivo | Acción | Propósito |
|---------|--------|-----------|
| `src/pages/admin/AdminLLMProvidersPage.jsx` | NUEVO | Página de gestión de proveedores LLM |
| `src/components/layout/AdminLayout.jsx` | MOD | +1 ítem menú "Config. IA" |
| `src/App.jsx` | MOD | +1 ruta `/admin/llm-providers` |

---

## Modelo de Base de Datos: `llm_providers`

```sql
CREATE TABLE llm_providers (
    id              SERIAL PRIMARY KEY,
    provider_key    VARCHAR NOT NULL,        -- 'gemini' | 'groq' | 'openai' | 'anthropic' | 'custom'
    display_name    VARCHAR NOT NULL,        -- "Google Gemini Flash 2.0"
    api_key_enc     TEXT NOT NULL,           -- CIFRADO con Fernet (ENCRYPTION_KEY del .env)
    model_name      VARCHAR NOT NULL,        -- "gemini-flash-latest", "llama-3.3-70b-versatile"
    base_url        VARCHAR,                 -- Solo para OpenAI-compatible (Groq, etc.)
    is_active       BOOLEAN DEFAULT TRUE,
    priority        INTEGER DEFAULT 1,       -- 1=primario, 2=fallback, etc.
    use_case        VARCHAR DEFAULT 'all',   -- 'blog' | 'social' | 'all'
    extra_params    JSONB,                   -- {"temperature": 0.7, "max_tokens": 2048}
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP
);
```

### Campo `provider_key` — Valores soportados

| Valor | Descripción | `base_url` requerida |
|-------|-------------|----------------------|
| `gemini` | Google Gemini (SDK nativo) | No |
| `groq` | Groq API (OpenAI-compatible) | Sí |
| `openai` | OpenAI oficial | No (usa default) |
| `anthropic` | Anthropic Claude (futuro) | N/A |
| `custom` | Cualquier API OpenAI-compatible | Sí |

---

## Servicio `llm_router.py` — Lógica de Despacho

El router lee los proveedores activos ordenados por `priority` ASC, los intenta en orden y hace fallback automático al siguiente en caso de error.

### Funciones públicas

```python
# Genera texto libre (para blog)
def call_llm_text(prompt: str, use_case: str = "all") -> str

# Genera y parsea JSON (para social/reels)  
def call_llm_json(prompt: str, use_case: str = "all") -> dict

# Invalida el cache manualmente (se llama al guardar un proveedor)
def invalidate_llm_cache() -> None
```

### Ciclo de vida del cache

- Se carga desde DB la primera vez que se llama
- TTL: 5 minutos (configurable en `LLM_CACHE_TTL` si se agrega a `config.py`)
- Se invalida inmediatamente al crear/editar/eliminar un proveedor desde admin

---

## API Endpoints: `/api/v1/admin/llm-providers`

Todos requieren autenticación como **superadmin** (`role='admin'`).

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/admin/llm-providers` | Lista todos los proveedores. API key enmascarada. |
| `POST` | `/admin/llm-providers` | Crea un nuevo proveedor. API key cifrada antes de guardar. |
| `PUT` | `/admin/llm-providers/{id}` | Edita. Si `api_key` llega vacío, conserva la existente. |
| `DELETE` | `/admin/llm-providers/{id}` | Elimina proveedor. No elimina si es el único activo. |
| `POST` | `/admin/llm-providers/{id}/test` | Hace una llamada real al proveedor y retorna latencia. |

### Formato de respuesta (GET, POST, PUT)

```json
{
  "id": 1,
  "provider_key": "gemini",
  "display_name": "Google Gemini Flash",
  "api_key_masked": "****4F2A",
  "model_name": "gemini-flash-latest",
  "base_url": null,
  "is_active": true,
  "priority": 1,
  "use_case": "all",
  "extra_params": {"temperature": 0.7},
  "created_at": "2026-05-21T00:00:00Z",
  "updated_at": "2026-05-21T12:00:00Z"
}
```

> **NUNCA** se devuelve la API key completa en ningún endpoint GET.

---

## Seguridad

- **Cifrado**: Las API keys se cifran con **Fernet** usando `ENCRYPTION_KEY` del `.env` antes de guardarse en DB. El mismo `ENCRYPTION_KEY` que usa el resto del sistema.
- **Acceso**: Solo `role='admin'` (superadmin `admin@appgynsys.com`) puede acceder a estos endpoints. El guard `get_current_admin_user` cubre todos los endpoints.
- **Mascarado**: Las respuestas de API nunca exponen la key completa. Solo retornan los últimos 4 caracteres como `****XXXX`.

---

## Seed Inicial (Primera Ejecución)

El archivo `app/seeds/seed_llm_providers.py` debe ejecutarse manualmente UNA VEZ para migrar las keys del `.env` a DB:

```bash
# En producción (Docker):
docker exec -w /app -e PYTHONPATH=. appgynsys-backend-1 python app/seeds/seed_llm_providers.py
```

El script:
1. Verifica si la tabla `llm_providers` está vacía
2. Si está vacía: lee `GEMINI_API_KEY` y `GROQ_API_KEY` del `.env`
3. Crea los registros con Gemini en priority=1, Groq en priority=2
4. Si la tabla ya tiene datos: no hace nada (idempotente)

---

## Operación desde el Super Admin

### Cambiar API Key de Gemini
1. Ir a `/admin/llm-providers`
2. Click en el botón **Editar** del proveedor "Google Gemini Flash"
3. En el campo **API Key**, borrar el contenido y escribir la nueva key completa
4. Click **Guardar**
5. El sistema invalida el cache automáticamente — la próxima llamada ya usa la key nueva

### Añadir un Nuevo Proveedor (ej: OpenAI)
1. Click en **+ Agregar Proveedor**
2. Seleccionar tipo: `OpenAI`
3. Nombre: `GPT-4o Mini`
4. API Key: `sk-proj-...`
5. Modelo: `gpt-4o-mini`
6. Prioridad: `3` (para que sea el tercer fallback)
7. Click **Guardar** → luego click **Probar Conexión** para verificar

### Probar una Key antes de Activarla
Usar el botón **Probar Conexión** en cualquier proveedor. Hace una llamada real con un prompt mínimo y retorna:
- ✅ Latencia en ms
- ✅ Primeras palabras de la respuesta
- ❌ Mensaje de error específico si falla

---

## Migración de Alembic

Al desplegar esta feature por primera vez en producción, ejecutar:

```bash
# 1. Pull del código nuevo
cd /opt/appgynsys && git pull origin main

# 2. Reconstruir backend
docker compose build backend

# 3. Aplicar migración de DB
docker exec -w /app -e PYTHONPATH=. appgynsys-backend-1 alembic upgrade head

# 4. Seed inicial de proveedores desde .env
docker exec -w /app -e PYTHONPATH=. appgynsys-backend-1 python app/seeds/seed_llm_providers.py

# 5. Reiniciar servicios
docker compose up -d
```

---

## Extensibilidad Futura

Para añadir un nuevo proveedor de IA (ej: Anthropic Claude):

**Backend** — Solo modificar `llm_router.py`:
```python
elif provider.provider_key == "anthropic":
    return _call_anthropic(provider, prompt)
```

**Frontend** — Añadir a la lista de tipos en el modal:
```jsx
{ value: 'anthropic', label: 'Anthropic Claude', icon: '🤖' }
```

No se requiere ninguna otra modificación. El sistema es agnóstico al proveedor.

---

## Troubleshooting

### "Todos los proveedores de IA fallaron"
- Verificar que al menos un proveedor esté activo en `/admin/llm-providers`
- Usar **Probar Conexión** para identificar cuál falla
- Revisar logs: `docker logs -f appgynsys-backend-1 | grep "llm_router"`

### "La key nueva no se está usando"
- El cache tiene TTL de 5 minutos. El sistema invalida automáticamente al guardar
- Si persiste: `docker restart appgynsys-backend-1` para forzar reinicio del cache

### "Error 403 al acceder a /admin/llm-providers"
- Solo `admin@appgynsys.com` tiene acceso
- Verificar token de autenticación

---

## Log de Implementación

| Fecha | Estado | Detalle |
|-------|--------|---------|
| 2026-05-21 | ✅ Planificado | Análisis de código base y diseño de arquitectura |
| 2026-05-21 | ✅ En progreso | Implementación backend + frontend |
