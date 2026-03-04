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

#### Opción A: Desde el Panel Admin (Recomendado)
El Panel de Super Admin ahora maneja el **borrado en cascada**. Al eliminar un inquilino desde la UI, se borran automáticamente sus citas, módulos y registros asociados.

#### Opción B: Manualmente vía SQL
Si necesitas eliminar un inquilino (ID X) manualmente por base de datos:
1. Edita `backend/scripts/cleanup_tenants.sql` con los IDs correctos.
2. Ejecuta:
```bash
docker exec -i appgynsys-db-1 psql -U postgres -d gynsys < backend/scripts/cleanup_tenants.sql
```

### Verificación de Integridad Post-Borrado
Para asegurar que no queden registros "huérfanos" (importante para mantener la DB ligera):
```sql
-- Verificar que no haya citas sin doctor válido
SELECT count(*) FROM appointments WHERE doctor_id NOT IN (SELECT id FROM doctors);

-- Verificar que no haya módulos sin tenant válido
SELECT count(*) FROM tenant_modules WHERE tenant_id NOT IN (SELECT id FROM doctors);
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

## 5. Resolución de Problemas y Recuperación de Datos

### Tablas Críticas de Médicos (Saas)
- `consultations`: Historias médicas y diagnósticos.
- `appointments`: Gestión de citas y preconsultas.
- `patients`: Listado de pacientes.
- `preconsultation_questions`: Configuración de preguntas por doctor.
- `services`: Servicios y especialidades configuradas.

### Recuperación desde Backups
Si se detecta pérdida de datos o discrepancias tras cambios de roles:

1. **Localizar Backups**:
   - `/opt/appgynsys/backend/backups/`: Copias automáticas cada hora (archivos `.sql`).
   - `backups/`: Zips históricos de migraciones.

2. **Crear Base de Datos de Recuperación**:
   ```bash
   docker exec appgynsys-db-1 psql -U postgres -c "CREATE DATABASE gynsys_restore;"
   ```

3. **Restaurar Backup a la DB de Recuperación**:
   ```bash
   docker exec -i appgynsys-db-1 psql -U postgres -d gynsys_restore < /ruta/al/backup.sql
   ```

4. **Transferir Datos Quirúrgicamente**:
   Ejemplo para restaurar consultas de un doctor (ID 1) desde `gynsys_restore`:
   ```bash
   # Exportar desde restore
   docker exec appgynsys-db-1 pg_dump -U postgres -d gynsys_restore \
     -t consultations -t appointments -t preconsultation_questions \
     --data-only --no-owner --no-privileges > /tmp/restore_data.sql
   
   # Importar a live
   docker exec -i appgynsys-db-1 psql -U postgres -d gynsys < /tmp/restore_data.sql
   ```

### Monitoreo de Backups
- Ver logs: `docker logs appgynsys-backend-1 | grep backup`
- El servicio corre en el startup del backend (`backend/app/main.py`) y usa `PGPASSWORD` del `.env`.
