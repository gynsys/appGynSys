# Incidente de Producción: Error CORS y Desincronización de VPS (25/03/2026)

## Resumen
El sistema experimentó una caída total de la funcionalidad de "Gestión de Historias Médicas" en producción. Los navegadores bloqueaban las peticiones a la API debido a errores de política CORS. La resolución tomó aproximadamente 2 horas e involucró intervención manual vía SSH.

## Síntomas
- Error en consola: `Access to XMLHttpRequest at '...' from origin 'https://gynsys.net' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
- La tabla de pacientes mostraba: "No hay historias registradas".
- Los endpoints `/health` respondían correctamente (200 OK), pero `/consultations/` devolvía 500 Internal Server Error.

## Causa Raíz
La desincronización entre la rama `main` de GitHub y el estado local del servidor VPS. 

1. **Despliegue Incompleto**: Tras un intento de implementar la edición unificada de informes, el código en el VPS quedó en un estado "híbrido".
2. **Crash Silencioso**: El backend intentaba acceder a una columna (`medical_report_content`) que no existía o el código no coincidía con el esquema de la base de datos local.
3. **Efecto en CORS**: En FastAPI/Starlette, si una excepción ocurre temprano en el proceso de la petición (antes o durante la ejecución del endpoint) y resulta en un 500 no manejado, a veces la middleware de CORS no llega a inyectar los encabezados en la respuesta de error o el navegador rechaza la respuesta por falta de los mismos.
4. **Persistencia**: El rollback mediante `git push --force` a GitHub no se reflejó automáticamente en el VPS, que seguía ejecutando el contenedor Docker basado en el commit fallido.

## Resolución
Se utilizó `ssh_runner.py` para realizar las siguientes acciones manuales en el servidor (`167.172.115.154`):

1. **Sincronización de Git**:
   ```bash
   cd /opt/appgynsys
   git fetch origin main
   git reset --hard origin/main
   ```
2. **Reconstrucción de Contenedores**:
   ```bash
   docker compose up -d --build backend
   ```
3. **Validación**:
   - Se verificaron los logs con `docker logs appgynsys-backend-1`.
   - Se confirmó que el error `UndefinedColumn: column consultations.medical_report_content does not exist` desapareció.

## Lecciones Aprendidas y Prevención
- **Verificar VPS tras Rollback**: No asumir que el push a GitHub despliega automáticamente en el VPS si hay capas de Docker o procesos de pull manual involucrados.
- **Herramientas de Diagnóstico**: `ssh_runner.py` es crítico para diagnosticar errores de producción que no se replican localmente.
- **Validación de CORS**: Un error de CORS suele ser síntoma de un error 500 subyacente que "rompe" la cadena de middleware. Siempre revisar los logs del servidor ante un fallo de CORS inesperado.

---
**Estado Final**: Sistema restaurado a la versión estable `50e3b6e` y posteriormente actualizado con parches de robustez de CORS (Pydantic v2).
