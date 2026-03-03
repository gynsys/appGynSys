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

**Reiniciar servicios tras cambios en Backend:**
```bash
cd /opt/appgynsys && docker compose restart backend celery_worker
```

**Ver logs en tiempo real (Celery):**
```bash
docker logs -f appgynsys-celery_worker-1
```

**Copiar archivos al contenedor (Debug):**
```bash
docker cp /tmp/script.py appgynsys-backend-1:/app/script.py
```

## 🌐 Redirección Inteligente (Frontend)

Ubicación: `frontend/src/App.jsx`
- Si el dominio es `gynsys.net` -> Muestra Landing Page.
- Si el dominio es `*.gynsys.net` (o tiene slug en URL) -> Redirige al perfil del médico.
- **Typo Fix Histórico**: La ruta de dashboard de pacientes es `/cycle/dashboard` (no `/cycles/`).

> [!IMPORTANT]
> Los nuevos registros de doctores **NO** pueden loguearse hasta ser aprobados. Verán el mensaje "Cuenta pendiente de aprobación".
