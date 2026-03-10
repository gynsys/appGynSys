# Guía Técnica: Gestión y Depuración de Soportes Multimedia

Este documento detalla la arquitectura, flujos de trabajo y comandos de mantenimiento asociados al sistema de "Soportes Multimedia" (imágenes, PDFs, vídeos adjuntos a las consultas médicas) dentro de la aplicación GynSys.

---

## 🏗️ 1. Arquitectura del Sistema

El módulo de soportes multimedia está compuesto por los siguientes elementos:

- **Base de Datos (PostgreSQL):** Tabla `consultation_assets`. Almacena la metadata del archivo (`file_name`, `file_path`, `file_type`, `file_size`) y su relación ForeignKey con la tabla `consultations`.
- **Backend (FastAPI):**
  - **Endpoints:** `/api/v1/consultations/{consultation_id}/assets` (POST para subir, GET para listar) y `/api/v1/consultations/assets/{asset_id}` (DELETE).
  - **Almacenamiento Local:** Los archivos físicos se guardan dentro del contenedor Docker en la ruta `/app/uploads`.
  - **Servidor Estático:** FastAPI expone la carpeta `uploads` públicamente montando un router `StaticFiles` en `/uploads`.
- **Frontend (React):**
  - **Componente:** `ConsultationAssetManager.jsx`.
  - **Visualización:** Transforma la ruta relativa (`/uploads/foto.jpg`) que entrega la base de datos en una URL absoluta concatenándola con la variable de entorno `VITE_API_BASE_URL` (para que apunte a `api.gynsys.net/uploads/...`).

---

## 🛠️ 2. Comandos de Despliegue y Mantenimiento (Backend)

Si se realizan cambios en los modelos de base de datos (`models/consultation_asset.py`) o en la lógica de subida en el servidor, **debe** actualizarse el VPS.

### 2.1 Conexión al Servidor
```bash
ssh root@167.172.115.154
```

### 2.2 Flujo Estándar de Actualización de Código
Una vez dentro del servidor, navega a la carpeta principal y jala los últimos cambios:
```bash
cd /opt/appgynsys
git pull origin main
```

Si el cambio requiere instalar librerías nuevas, se deben re-construir los contenedores:
```bash
docker compose build backend celery_worker
docker compose up -d backend celery_worker
```
*(Si solo cambiaste Python/FastAPI sin tocar el requirements.txt, un simple `docker compose restart backend` es suficiente).*

### 2.3 Ejecución de Migraciones de Base de Datos (Alembic)
Cuando se agrega o modifica una tabla asociada a los archivos multimedia, se debe sincronizar la base de datos de producción:

**Generar la migración automáticamente (si no se subió desde local):**
```bash
docker exec appgynsys-backend-1 alembic revision --autogenerate -m "Cambios en Assets"
```

**Aplicar la migración a PostgreSQL:**
```bash
docker exec appgynsys-backend-1 alembic upgrade head
```

---

## 🚨 3. Solución de Problemas Comunes (Troubleshooting)

### Problema A: Error 404 al intentar Subir un Archivo (POST)
- **Causa:** El endpoint `/assets` está siendo ignorado debido a que fue declarado en `consultations.py` justo **por debajo** de un endpoint genérico como `/{consultation_id}` (Route Shadowing).
- **Solución:** Mover los métodos `@router.post("/{consultation_id}/assets")` hacia arriba en el archivo `endpoints/consultations.py`, antes de las rutas dinámicas generales.

### Problema B: Error 404 al visualizar la Imagen en la Galería Frontend
- **Causa:** El archivo sí se guardó en PostgreSQL, pero React está intentando acceder a él usando rutas de Netlify (ej: `https://gynsys.net/uploads/imagen.jpg`) en lugar de apuntar a la API.
- **Solución:** En `ConsultationAssetManager.jsx`, usar la función auxiliar `getFullUrl` para asegurar que el string lleve como prefijo la variable `import.meta.env.VITE_API_BASE_URL`.

### Problema C: El "Skeleton" de Carga nunca desaparece de React
- **Causa:** Un ciclo infinito en React (infinite loop). El `useEffect` detecta longitud `0`, pide al servidor los archivos, el servidor contesta `[]` (longitud 0), el `useEffect` vuelve a dispararse infinitamente.
- **Solución:** Usar `useRef` como guardia para rastrear si la petición de la consulta (`hasFetchedForId.current`) ya se efectuó.

### Problema D: Error "(psycopg2.errors.UndefinedTable) relation "consultation_assets" does not exist"
- **Causa:** FastApi intentó consultar la tabla antes de que Alembic la construyera en producción.
- **Solución:** Ejecutar el Paso 2.3 de esta guía (`alembic upgrade head`).

---

## 📂 4. Inspección Rápida de Logs

Para ver si el Backend está procesando los archivos multimedia (códigos 200 OK) o si algo truena:
```bash
# Ver las últimas 50 líneas del backend en vivo:
docker logs appgynsys-backend-1 --tail 50 -f

# Filtrar específicamente tráfico del endpoint de Soportes:
docker logs appgynsys-backend-1 | grep "assets"
```

---

## 🔄 5. Flujos de Trabajo (Workflows)

### 5.1 De Preconsulta a Historia Médica
Es crucial entender el ciclo de vida de un documento multimedia dentro de la aplicación:
1. **Fase de Preconsulta (`DoctorConsultationPage.jsx`)**: Cuando el paciente está en sala de espera o siendo preparado, se pueden subir Soportes Multimedias iniciales. Dado que todavía no se ha "Guardado la Consulta" en su totalidad (no hay `consultation_id` real), estos archivos se agrupan temporalmente en memoria (estado de React `pendingAssets`).
2. **Commit de la Consulta**: Al presionar "Guardar Consulta", se crea el registro primario y se obtiene un `consultation_id`. Inmediatamente después, el Frontend itera sobre `pendingAssets` y realiza los POSTs al servidor uno por uno para guardarlos y asociarlos al ID recién creado.
3. **Visor de Historial (`PatientsManager.jsx`)**: Cualquier archivo que se haya cargado desde la vista de Preconsulta estará disponible automáticamente para su visualización y descarga en el **Panel de Historias Médicas** (Gestor de Pacientes -> Vista Previa). El componente `ConsultationAssetManager` se reutiliza en modo pestaña para renderizar dichos "assets" con su respectivo identificador.
