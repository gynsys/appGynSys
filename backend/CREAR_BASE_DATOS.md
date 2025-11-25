# ✅ Solución: no such table: doctors

## ❌ Problema
```
sqlite3.OperationalError: no such table: doctors
```

La base de datos no tiene las tablas creadas.

## ✅ Solución: Crear las Tablas

### Paso 1: Detener el Backend Temporalmente
En la terminal donde está corriendo `uvicorn`:
- Presiona **Ctrl+C** para detenerlo

### Paso 2: Crear las Migraciones
```powershell
# Asegúrate de estar en el directorio del backend
cd C:\Users\pablo\Desktop\appgynsys\backend

# Asegúrate de que el entorno virtual esté activado
..\..\gynsys\venv\Scripts\activate

# Crear la migración inicial
alembic revision --autogenerate -m "Initial migration - Doctors and Appointments"
```

### Paso 3: Aplicar las Migraciones
```powershell
alembic upgrade head
```

Esto creará las tablas en la base de datos.

### Paso 4: Reiniciar el Backend
```powershell
uvicorn app.main:app --reload
```

### Paso 5: Probar de Nuevo
1. Vuelve a http://localhost:5173
2. Intenta registrarte de nuevo
3. ✅ Ahora debería funcionar

---

## 📝 Comandos Completos

En la terminal (con el backend detenido):

```powershell
cd C:\Users\pablo\Desktop\appgynsys\backend
..\..\gynsys\venv\Scripts\activate
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
uvicorn app.main:app --reload
```

---

## ✅ Después de Crear las Tablas

Deberías ver:
- ✅ El backend corriendo sin errores
- ✅ Puedes registrarte desde el frontend
- ✅ La base de datos `gynsys.db` creada en `backend/`

