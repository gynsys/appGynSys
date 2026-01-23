# 🔧 Solución: Error CORS y Error 500

## ❌ Problemas Detectados

1. **Error CORS**: El backend no permite solicitudes desde el frontend
2. **Error 500**: Error interno del servidor al intentar registrar

## ✅ Solución 1: Verificar CORS

### Paso 1: Verificar Configuración
El archivo `backend/app/core/config.py` debe tener:

```python
CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
```

### Paso 2: Verificar que el Backend Esté Corriendo
1. Abre: http://localhost:8000/docs
2. Si no funciona, el backend no está corriendo

### Paso 3: Reiniciar el Backend
Si el backend está corriendo pero hay error de CORS:
1. Detén el backend (Ctrl+C)
2. Reinícialo: `uvicorn app.main:app --reload`

---

## ✅ Solución 2: Error 500 (Error Interno)

El error 500 significa que hay un problema en el código del backend.

### Ver los Logs del Backend

En la terminal donde está corriendo el backend, deberías ver el error exacto.

**Comparte el error que aparece en la terminal del backend** para poder solucionarlo.

### Posibles Causas:

1. **Base de datos no creada**: Ejecuta `alembic upgrade head`
2. **Error en el código**: Revisa los logs del backend
3. **Dependencias faltantes**: Verifica que todas estén instaladas

---

## 🔍 Diagnóstico Rápido

### 1. Verificar que el Backend Esté Corriendo
```powershell
# En la terminal del backend deberías ver:
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 2. Probar el Backend Directamente
1. Abre: http://localhost:8000/docs
2. Prueba el endpoint `POST /api/v1/auth/register` desde Swagger
3. Si funciona en Swagger pero no desde el frontend, es problema de CORS
4. Si no funciona en Swagger, es problema del backend

### 3. Ver los Logs
En la terminal del backend, cuando intentas registrar, deberías ver el error exacto.

---

## 📝 Pasos para Solucionar

### Paso 1: Verificar Backend
```powershell
# Asegúrate de que el backend esté corriendo
cd C:\Users\pablo\Desktop\appgynsys\backend
..\..\gynsys\venv\Scripts\activate
uvicorn app.main:app --reload
```

### Paso 2: Verificar Base de Datos
```powershell
alembic upgrade head
```

### Paso 3: Probar desde Swagger
1. Abre: http://localhost:8000/docs
2. Prueba `POST /api/v1/auth/register`
3. Mira el error que aparece

### Paso 4: Compartir el Error
**Comparte el error exacto que aparece en la terminal del backend** cuando intentas registrar.

---

## ⚠️ Importante

**Necesito ver el error que aparece en la terminal del backend** para poder solucionarlo.

Cuando intentas registrar desde el frontend, ¿qué error aparece en la terminal donde está corriendo `uvicorn`?

