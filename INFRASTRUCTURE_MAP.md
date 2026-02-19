# 🗺️ Mapa de Infraestructura: GynSys

Este documento detalla la arquitectura de servicios y la estructura de datos para facilitar el mantenimiento y evitar confusiones entre entornos.

## 🚀 Entorno de Producción (DigitalOcean)

- **Dirección IP:** `167.172.115.154`
- **Usuario SSH:** `root`
- **Senda en Servidor:** `/opt/appgynsys`
- **Orquestación:** Docker Compose

### 📦 Servicios y Contenedores
| Nombre del Servicio | Nombre del Contenedor | Imagen Docker | Propósito |
| :--- | :--- | :--- | :--- |
| **Backend API** | `appgynsys-backend-1` | `appgynsys-backend` | API FastAPI (Puerto 8000) |
| **Database** | `appgynsys-db-1` | `postgres:15-alpine` | PostgreSQL 15 (Puerto 5432 interno) |
| **Cache & Broker** | `appgynsys-redis-1` | `redis:alpine` | Redis para sesiones y Celery |
| **Task Worker** | `appgynsys-celery_worker-1` | `appgynsys-celery_worker`| Procesamiento de tareas asíncronas |
| **Scheduler** | `appgynsys-celery_beat-1` | `appgynsys-backend` | Tareas programadas (Backups, etc) |
| **Object Storage**| `appgynsys-minio-1` | `minio/minio` | Almacenamiento de archivos/imágenes |

---

## 🗄️ Estructura de Base de Datos (Producción)

- **Motor:** PostgreSQL 15
- **Nombre de BD:** `gynsys`
- **Usuario Principal:** `postgres`

### 📊 Tablas Importantes
| Categoría | Tablas Críticas |
| :--- | :--- |
| **Identidad** | `doctors`, `tenants`, `plans`, `modules` |
| **Mi Ciclo** | `cycle_users`, `cycle_logs`, `symptom_logs`, `pregnancy_logs` |
| **Notificaciones**| `notification_logs`, `push_subscriptions`, `cycle_notification_settings` |
| **Clínica** | `patients`, `appointments`, `consultations` |
| **Contenido** | `blog_posts`, `gallery_images`, `testimonials` |

---

## 🧹 Mantenimiento Directo (SSH Shortcut)

### Limpieza de Datos de Prueba (Mi Ciclo)
Este comando vacía toda la data de usuarias de seguimiento de ciclo en producción:
```bash
ssh root@167.172.115.154 "docker exec appgynsys-db-1 psql -U postgres -d gynsys -c 'TRUNCATE cycle_logs, symptom_logs, pregnancy_logs, cycle_notification_settings, push_subscriptions, notification_logs CASCADE; DELETE FROM cycle_users; DELETE FROM patients;'"
```

### Limpieza de Cache
```bash
ssh root@167.172.115.154 "docker exec appgynsys-redis-1 redis-cli flushall"
```

---

## 📂 Configuración del Sistema
- **Archivo de Entorno (Local):** [backend/.env](./backend/.env)
- **Instancia de Configuración:** [config.py](./backend/app/core/config.py)
- **Modelos de BD:** Definidos en `backend/app/db/models/`
