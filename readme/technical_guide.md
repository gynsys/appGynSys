# Guía Técnica de Operaciones: GynSys SaaS

Esta guía documenta los componentes críticos, comandos y flujos lógicos del sistema para facilitar el mantenimiento futuro y el escalado de la plataforma.

## 🏗️ Arquitectura y Ubicaciones (Producción)

| Componente | Ubicación en Servidor | Detalles |
| :--- | :--- | :--- |
| **Raíz del Proyecto** | `/opt/appgynsys` | Directorio base de Docker Compose. |
| **Backend (API)** | `/opt/appgynsys/backend` | FastAPI ejecutado en contenedor `appgynsys-backend-1`. |
| **Frontend (SaaS)** | [Netlify](https://app.netlify.com/) | Desplegado desde la rama `main` del repo. |
| **Base de Datos** | Contenedor `appgynsys-db-1` | PostgreSQL 15, base de datos `gynsys`. |
| **Logs de Celery** | `/opt/appgynsys/logs` | Seguimiento de tareas de email y seedeo. |
| **VAPID / Push** | `/opt/appgynsys/backend`| Archivos `vapid_private.pem` y `public.pem`. |

## 🗄️ Base de Datos: Tablas y Relaciones Críticas

| Tabla | Propósito | Notas de Mantenimiento |
| :--- | :--- | :--- |
| `doctors` | Inquilinos (Tenants) | Columna `status`: `pending`, `active`, `paused`. |
| `plans` | Planes SaaS | IDs fijos: 1 (Básico), 2 (Pro), 3 (Premium). |
| `cycle_users` | Pacientes | Relacionados a un `doctor_id`. |
| `tenant_modules`| Módulos activos | Define qué funciones ve cada doctor. |

### Comandos de Emergencia (PostgreSQL)

Para entrar a la consola desde el host:
```bash
docker exec -it appgynsys-db-1 psql -U postgres -d gynsys
```

**Consultar tenants y estados:**
```sql
SELECT id, nombre_completo, slug_url, status FROM doctors ORDER BY id;
```

**Restaurar planes (Si ForeignKeyViolation en registro):**
```sql
-- Verificar que existan IDs 1, 2, 3
SELECT * FROM plans;
```

## 🚀 Flujo de Onboarding SaaS (Lógica de Negocio)

1. **Registro**: El formulario en `gynsys.net/register?type=doctor` crea el registro en `doctors` con `status='pending'` e `is_active=False`.
2. **Notificación**: Se encola una tarea de Celery (`send_new_tenant_notification`) hacia `dramarielh@gmail.com`.
3. **Seedeo**: Se activa `apply_doctor_template_async` que copia la estructura de la "Dra. Mariel Herrera" al nuevo inquilino.
4. **Aprobación**: El Admin activa al médico en el panel. Esto cambia `status='approved'`, `is_active=True` y auto-habilita su email en la whitelist de Google OAuth.

## 🛠️ Comandos SSH Frecuentes

**Despliegue estándar (sin cambios locales):**
```bash
cd /opt/appgynsys && git pull origin main && docker compose build backend celery_worker && docker compose up -d
```

**Despliegue con cambios locales en el servidor (Conflictos):**
Si `git pull` falla por cambios locales:
```bash
cd /opt/appgynsys
git stash                  # Guarda cambios locales
git pull origin main       # Baja la última versión
git stash pop              # Intenta re-aplicar cambios locales (opcional)
docker compose build backend
docker compose up -d
```

**Ver logs en tiempo real:**
```bash
# Backend (Errores de API / 500)
docker logs -f appgynsys-backend-1

# Celery (Emails / Tareas persistentes)
docker logs -f appgynsys-celery_worker-1

# Beat (Programación de tareas)
docker logs -f appgynsys-celery_beat-1
```

## 🧹 Limpieza y Eliminación de Módulos

Para eliminar un módulo completo (ejemplo: `chat`), se debe seguir este orden para evitar inconsistencias:

1. **Base de Datos**: Eliminar tablas y registros en `modules` y `tenant_modules`.
   ```sql
   -- Ejemplo para el módulo chat
   DELETE FROM tenant_modules WHERE module_id = (SELECT id FROM modules WHERE name = 'chat');
   DELETE FROM modules WHERE name = 'chat';
   DROP TABLE IF EXISTS chat_messages, chat_participants, chat_rooms;
   ```
2. **Backend**: Eliminar el directorio del módulo (`backend/app/chat`) y sus referencias en `backend/app/main.py` o routers.
3. **Frontend**: Eliminar componentes y hooks asociados (`frontend/src/modules/chat`) y limpiar rutas en `App.jsx`.
4. **Rebuild**: Forzar reconstrucción para limpiar cachés de Python.
   ```bash
   docker compose build backend && docker compose up -d
   ```

## ⚠️ Resolución de Problemas Comunes

### 1. IntegrityError (ForeignKeyViolation)
**Síntoma**: Error 500 al eliminar un tenant o plan.
**Causa**: Falta de borrado en cascada en las relaciones de SQLAlchemy o el contenedor no tiene la última lógica.
**Solución**:
1. Verificar que el código en el servidor tenga `cascade="all, delete-orphan"` en el modelo.
2. Forzar reconstrucción: `docker compose build backend`.
3. Reiniciar: `docker compose up -d`.

### 2. Error de Conexión a DB (psycopg2)
**Síntoma**: "could not translate host name 'db' to address".
**Causa**: El script se ejecuta fuera del entorno Docker o la red interna de Docker falló.
**Solución**: Asegurarse de que el script se ejecute con `docker exec` o que el container `db` esté arriba.


## 🌐 Redirección Inteligente (Frontend)

Ubicación: `frontend/src/App.jsx`
- Si el dominio es `gynsys.net` -> Muestra Landing Page.
- Si el dominio es `*.gynsys.net` (o tiene slug en URL) -> Redirige al perfil del médico.
- **Typo Fix Histórico**: La ruta de dashboard de pacientes es `/cycle/dashboard` (no `/cycles/`).

> [!IMPORTANT]
> Los nuevos registros de doctores **NO** pueden loguearse hasta ser aprobados. Verán el mensaje "Cuenta pendiente de aprobación".
