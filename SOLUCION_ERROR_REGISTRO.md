# 🔧 Solución: Error al Registrar

## ❌ Problema
"Error al registrar. Por favor intenta de nuevo."

## ✅ Soluciones

### 1. Verificar que el Backend esté Corriendo

El frontend necesita que el backend esté activo. Verifica:

1. **Abre OTRA terminal** (deja el frontend corriendo)
2. Ve al directorio del backend:
   ```powershell
   cd C:\Users\pablo\Desktop\appgynsys\backend
   ```
3. Inicia el backend:
   ```powershell
   start_backend.bat
   ```
   O manualmente:
   ```powershell
   uvicorn app.main:app --reload
   ```

4. Deberías ver:
   ```
   Uvicorn running on http://127.0.0.1:8000
   ```

### 2. Verificar la URL de la API

1. Abre el navegador donde está el frontend
2. Presiona **F12** (abre las herramientas de desarrollador)
3. Ve a la pestaña **"Console"** o **"Consola"**
4. Intenta registrarte de nuevo
5. Mira los errores en la consola

### 3. Verificar que la Base de Datos Exista

El backend necesita la base de datos creada:

1. En la terminal del backend, ejecuta:
   ```powershell
   cd C:\Users\pablo\Desktop\appgynsys\backend
   alembic upgrade head
   ```

2. Esto creará las tablas necesarias

### 4. Probar el Backend Directamente

1. Abre: **http://localhost:8000/docs**
2. Deberías ver la documentación de Swagger
3. Prueba el endpoint `POST /api/v1/auth/register`:
   - Click en "Try it out"
   - Completa el formulario:
     ```json
     {
       "email": "test@example.com",
       "password": "password123",
       "nombre_completo": "Dr. Test"
     }
     ```
   - Click en "Execute"
   - ✅ Si funciona aquí, el problema es en el frontend

### 5. Verificar CORS

Si ves errores de CORS en la consola:

1. Verifica que `backend/app/core/config.py` tenga:
   ```python
   CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
   ```

### 6. Verificar Variables de Entorno

1. Verifica que el frontend tenga el archivo `.env` con:
   ```
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```

2. Si no existe, créalo en `frontend/.env`

---

## 🔍 Diagnóstico Rápido

### Checklist:
- [ ] Backend está corriendo en http://localhost:8000
- [ ] Puedo acceder a http://localhost:8000/docs
- [ ] Base de datos creada (alembic upgrade head)
- [ ] Frontend tiene archivo .env con la URL correcta
- [ ] No hay errores de CORS en la consola del navegador

---

## 📝 Pasos Recomendados

1. **Inicia el backend** (si no está corriendo)
2. **Verifica** http://localhost:8000/docs funciona
3. **Crea la base de datos**: `alembic upgrade head`
4. **Intenta registrarte de nuevo**
5. **Revisa la consola del navegador** (F12) para ver el error exacto

---

## 🆘 Si Nada Funciona

Comparte:
1. El error exacto de la consola del navegador (F12 → Console)
2. Si el backend está corriendo
3. Si puedes acceder a http://localhost:8000/docs

