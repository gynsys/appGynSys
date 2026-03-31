# Reporte de Incidente: Resolución de Error 502 Bad Gateway y CORS

Este documento detalla el diagnóstico y la solución del error crítico que dejó fuera de servicio el backend de GynSys el 31 de Marzo de 2026.

---

## 1. Síntomas del Problema
- **Frontend**: Los usuarios encontraban errores `502 Bad Gateway` al intentar acceder al Dashboard.
- **Consola del Navegador**: Múltiples errores de `CORS policy` bloqueando peticiones a `api.gynsys.net`.
- **Backend**: El contenedor `appgynsys-backend-1` aparecía como "Up", pero no respondía a peticiones en el puerto 8000.

---

## 2. Causa Raíz (El Error)
El crash fue causado por un **error de importación** introducido en el nuevo módulo de campañas:

```python
# Archivo: backend/app/api/v1/endpoints/campaigns.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTask
```

**El error:** Se intentó importar `BackgroundTask` (en singular) desde el paquete principal de `fastapi`.
**La realidad:** FastAPI no exporta `BackgroundTask` directamente en su namespace principal en la versión instalada. Se debe usar `BackgroundTasks` (en plural) o importarlo desde `starlette.background`.

Este error impedía que el módulo `app.main` se cargara, lo que a su vez causaba que el servidor `uvicorn` fallara inmediatamente al arrancar ("Silent Crash").

---

## 3. Proceso de Diagnóstico (Paso a Paso)

### Paso 1: Verificación de Contenedores
Se comprobó el estado de los servicios en el servidor:
```bash
docker ps
```
*Observación:* Los contenedores estaban arriba, pero el backend no generaba logs nuevos.

### Paso 2: Análisis de Nginx
Se revisaron los logs de Nginx para confirmar si el tráfico llegaba al proxy:
```bash
docker logs appgynsys-nginx-1 --tail 20
```
*Resultado:* Se confirmaron los errores 502. Nginx no podía conectar con el "upstream" (backend:8000).

### Paso 3: Script de Diagnóstico de Importación
Debido a que `docker logs` no mostraba el traceback del error, se utilizó un script de Python manual para forzar la carga del módulo y capturar la excepción:

```python
# check_import.py
try:
    from app.main import app
    print("IMPORT_SUCCESSFUL")
except Exception as e:
    import traceback
    traceback.print_exc()
```

Ejecución en el servidor:
```bash
docker exec appgynsys-backend-1 python /app/check_import.py
```
*Resultado:* Reveló el `ImportError: cannot import name 'BackgroundTask' from 'fastapi'`.

---

## 4. Solución Aplicada

1. **Corrección de Código**: Se eliminó la importación inválida en `campaigns.py`.
2. **Sincronización**:
   ```bash
   git pull origin main
   ```
3. **Migraciones de Base de Datos**: Se ejecutaron las migraciones pendientes para asegurar que las tablas de campañas existieran:
   ```bash
   # Dentro del contenedor backend
   alembic upgrade head
   ```
4. **Reinicio de Servicios**: Se forzó el refresco de la configuración usando el archivo de producción:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend nginx
   ```

---

## 5. Recomendaciones para el Futuro
- **Verificación Local**: Siempre ejecutar `python -m py_compile app/main.py` antes de hacer push para detectar errores de sintaxis o importación básica.
- **Logs Persistentes**: Si `docker logs` está vacío, usar `docker exec` para correr el proceso de forma interactiva y ver la salida de error en tiempo real.
- **Check-ins Intermedios**: Realizar un `healthcheck` interno (`curl http://localhost:8000/health`) inmediatamente después de un despliegue masivo.
- **Importaciones Limpias**: Seguir la convención de FastAPI y usar `BackgroundTasks` para tareas en segundo plano integradas en los endpoints.

---
**Estado Final: Operativo (HTTP 200)**  
**Responsable: Antigravity AI**
