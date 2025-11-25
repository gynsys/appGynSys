# 🚀 Iniciar el Backend (Necesario para el Registro)

## ⚠️ Problema
El frontend está corriendo pero el backend no, por eso falla el registro.

## ✅ Solución: Iniciar el Backend

### Paso 1: Abrir Nueva Terminal
**IMPORTANTE:** Deja el frontend corriendo y abre una **NUEVA** terminal.

### Paso 2: Ir al Directorio del Backend
```powershell
cd C:\Users\pablo\Desktop\appgynsys\backend
```

### Paso 3: Activar Entorno Virtual (si existe)
```powershell
# Si tienes venv en gynsys
..\..\gynsys\venv\Scripts\activate

# O si creaste uno nuevo en appgynsys
venv\Scripts\activate
```

### Paso 4: Instalar Dependencias (si no lo has hecho)
```powershell
pip install -r requirements.txt
```

### Paso 5: Crear la Base de Datos
```powershell
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

### Paso 6: Iniciar el Backend
```powershell
uvicorn app.main:app --reload
```

O usa el script:
```powershell
start_backend.bat
```

### Paso 7: Verificar que Funciona
1. Abre navegador en: **http://localhost:8000/docs**
2. Deberías ver la documentación de Swagger
3. ✅ Si funciona, el backend está corriendo

---

## ✅ Después de Iniciar el Backend

1. **Deja el backend corriendo** (no cierres esa terminal)
2. **Vuelve al frontend** en http://localhost:5173
3. **Intenta registrarte de nuevo**
4. ✅ Ahora debería funcionar

---

## 📝 Resumen de Comandos

En una **NUEVA** terminal:

```powershell
cd C:\Users\pablo\Desktop\appgynsys\backend
..\..\gynsys\venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

---

## 🔍 Verificar que Todo Funciona

### Backend:
- ✅ http://localhost:8000/docs (debería mostrar Swagger)
- ✅ http://localhost:8000/health (debería retornar `{"status": "healthy"}`)

### Frontend:
- ✅ http://localhost:5173 (debería mostrar la landing page)

### Registro:
- ✅ Ahora debería funcionar sin errores

---

## ⚠️ Nota Importante

Necesitas **DOS terminales abiertas**:
1. **Terminal 1:** Frontend corriendo (`npm run dev`)
2. **Terminal 2:** Backend corriendo (`uvicorn app.main:app --reload`)

Ambas deben estar corriendo al mismo tiempo.

