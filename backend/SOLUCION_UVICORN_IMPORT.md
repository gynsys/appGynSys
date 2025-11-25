# 🔧 Solución: Error de Importación de uvicorn

## ❌ Problema
```
Error loading ASGI app. Import string "app.main:" must be in format "<module>:<attribute>".
```

## ✅ Solución

### Verificar que estás en el directorio correcto

El comando `uvicorn app.main:app` debe ejecutarse desde el directorio `backend/`, NO desde `backend/app/`.

### Paso 1: Verificar Directorio Actual

```powershell
# Deberías estar aquí:
cd C:\Users\pablo\Desktop\appgynsys\backend

# Verifica que estás en el lugar correcto
dir
# Deberías ver: app/, alembic/, requirements.txt, etc.
```

### Paso 2: Verificar que el Módulo Existe

```powershell
# Verifica que existe app/main.py
dir app\main.py
```

### Paso 3: Ejecutar uvicorn Correctamente

```powershell
# Asegúrate de estar en backend/
cd C:\Users\pablo\Desktop\appgynsys\backend

# Activa el entorno virtual
..\..\gynsys\venv\Scripts\activate

# Ejecuta uvicorn (sin espacios extra, sin dos puntos al final)
uvicorn app.main:app --reload
```

**IMPORTANTE:** El comando es `app.main:app` (con un solo dos puntos, no `app.main:`)

---

## 🔍 Comandos Correctos

```powershell
# 1. Ir al directorio backend
cd C:\Users\pablo\Desktop\appgynsys\backend

# 2. Activar entorno virtual
..\..\gynsys\venv\Scripts\activate

# 3. Verificar estructura
dir app
dir app\main.py

# 4. Ejecutar uvicorn
uvicorn app.main:app --reload
```

---

## ⚠️ Errores Comunes

### Error: "No module named 'app'"
- **Causa:** Estás ejecutando desde el directorio incorrecto
- **Solución:** Asegúrate de estar en `backend/`, no en `backend/app/`

### Error: "Import string must be in format"
- **Causa:** Hay un espacio o carácter extra en el comando
- **Solución:** Usa exactamente: `uvicorn app.main:app --reload`

### Error: "No such file or directory"
- **Causa:** El archivo `app/main.py` no existe
- **Solución:** Verifica que el archivo existe: `dir app\main.py`

---

## ✅ Verificación Final

Cuando ejecutes correctamente, deberías ver:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

