# Guía de Operaciones SaaS - GynSys

Esta guía contiene comandos y procedimientos críticos para el mantenimiento de inquilinos (tenants) y el panel de administración central.

## 1. Gestión de Inquilinos (Tenants)

### Diagnóstico de Inquilinos
Para ver el estado actual de todos los inquilinos en la base de datos:
```bash
docker exec appgynsys-db-1 psql -U postgres -d gynsys -c "SELECT id, email, slug_url, role, status, is_active FROM doctors;"
```

### Estados Cruciales
- **active**: El inquilino está activo y es contabilizado en las estadísticas del Dashboard.
- **paused/suspended**: El inquilino no tiene acceso pero sus datos se mantienen.
- **approved**: Estado legado (evitar). El sistema ahora usa `active` para que se refleje correctamente en el dashboard.

### Limpieza de Inquilinos Duplicados o de Prueba
Si necesitas eliminar un inquilino (ID X) manualmente, usa el script de limpieza para manejar las claves foráneas:
1. Edita `backend/scripts/cleanup_tenants.sql` con los IDs correctos.
2. Ejecuta:
```bash
docker exec -i appgynsys-db-1 psql -U postgres -d gynsys < backend/scripts/cleanup_tenants.sql
```

## 2. Restauración de Acceso Super Admin

Si la cuenta `admin@appgynsys.com` se pierde o bloquea, usa el script de restauración:
```bash
docker exec -w /app -e PYTHONPATH=. appgynsys-backend-1 python scripts/restore_admin.py
```
*Nota: Esto establecerá la contraseña temporal `Admin.Gynsys.2024` y el slug `admin-panel-system`.*

## 3. Mantenimiento del Sistema

### Reiniciar Servicios
Después de cambios en la lógica del backend o scripts CRUD:
```bash
docker restart appgynsys-backend-1 appgynsys-celery-1
```

### Logs de Errores
Para monitorear problemas de registro o aplicación de plantillas:
```bash
docker logs -f appgynsys-backend-1
```

## 4. Plantillas SaaS (Templates)

El archivo `backend/mariel_herrera_template.json` es la fuente de verdad para los nuevos usuarios. 
Para actualizar la plantilla basada en un usuario existente (Ej: Mariel Herrera):
1. Ejecuta el script de extracción:
```bash
docker exec -w /app -e PYTHONPATH=. appgynsys-backend-1 python scripts/extract_saas_template.py
```
2. Git commit y push para que el cambio sea permanente.
