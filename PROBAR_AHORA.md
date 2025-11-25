# 🚀 Probar el Sistema - Guía Rápida

## Paso 1: Preparar el Backend

### Opción A: Usar el script (Más fácil)
1. Abre el Explorador de Archivos
2. Ve a: `C:\Users\pablo\Desktop\appgynsys\backend`
3. Haz doble clic en: `start_backend.bat`

### Opción B: Manual (Terminal)
1. Abre PowerShell o CMD
2. Ejecuta:
```powershell
cd C:\Users\pablo\Desktop\appgynsys\backend

# Activar entorno virtual (si existe en el directorio padre)
..\..\gynsys\venv\Scripts\activate

# O crear uno nuevo:
python -m venv venv
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Crear migración inicial
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head

# Iniciar servidor
uvicorn app.main:app --reload
```

✅ **El backend estará en:** http://localhost:8000
✅ **Documentación API:** http://localhost:8000/docs

---

## Paso 2: Preparar el Frontend

### Opción A: Usar el script (Más fácil)
1. Abre **OTRA** ventana del Explorador de Archivos
2. Ve a: `C:\Users\pablo\Desktop\appgynsys\frontend`
3. Haz doble clic en: `start_frontend.bat`

### Opción B: Manual (Terminal)
1. Abre **NUEVA** terminal (PowerShell o CMD)
2. Ejecuta:
```powershell
cd C:\Users\pablo\Desktop\appgynsys\frontend

# Instalar dependencias (solo la primera vez)
npm install

# Iniciar servidor
npm run dev
```

✅ **El frontend estará en:** http://localhost:5173

---

## Paso 3: Verificar que Funciona

### 1. Verificar Backend
- Abre navegador en: **http://localhost:8000/docs**
- Deberías ver la documentación de Swagger
- Prueba el endpoint `GET /health` → Debe retornar `{"status": "healthy"}`

### 2. Verificar Frontend
- Abre navegador en: **http://localhost:5173**
- Deberías ver la página de inicio (Landing Page)

### 3. Probar Registro
1. Ve a: **http://localhost:5173/register**
2. Completa el formulario:
   - Nombre: "Dr. Juan Pérez"
   - Email: "juan@example.com"
   - Contraseña: "password123"
3. Click en "Registrarse"
4. ✅ Debería redirigir al dashboard

### 4. Probar Login
1. Ve a: **http://localhost:5173/login**
2. Ingresa:
   - Email: "juan@example.com"
   - Contraseña: "password123"
3. Click en "Iniciar sesión"
4. ✅ Debería redirigir al dashboard

### 5. Ver Perfil Público
1. Después de registrarte, tu slug será algo como: `dr-juan-perez`
2. Ve a: **http://localhost:5173/dr/dr-juan-perez**
3. ✅ Deberías ver tu perfil público

---

## 🐛 Solución de Problemas

### Error: "ModuleNotFoundError" en Backend
**Solución:**
```powershell
# Asegúrate de estar en el entorno virtual
cd C:\Users\pablo\Desktop\appgynsys\backend
..\..\gynsys\venv\Scripts\activate
pip install -r requirements.txt
```

### Error: "Port 8000 already in use"
**Solución:**
```powershell
# Cambiar puerto
uvicorn app.main:app --reload --port 8001
```
Luego actualiza el `.env` del frontend con el nuevo puerto.

### Error: "npm no se reconoce"
**Solución:** Instala Node.js desde https://nodejs.org/

### Error: "Database locked"
**Solución:** Cierra otras conexiones y reinicia el servidor backend

### Error: CORS en el navegador
**Solución:** Verifica que `CORS_ORIGINS` en `backend/app/core/config.py` incluya `http://localhost:5173`

---

## ✅ Checklist

- [ ] Backend inicia sin errores
- [ ] Puedo acceder a http://localhost:8000/docs
- [ ] Frontend inicia sin errores
- [ ] Puedo acceder a http://localhost:5173
- [ ] Puedo registrarme
- [ ] Puedo iniciar sesión
- [ ] Puedo ver mi perfil público
- [ ] El token JWT se guarda (F12 → Application → Local Storage)

---

## 📝 Notas

- **Base de datos:** Se creará automáticamente `gynsys.db` en `backend/`
- **Primera vez:** Necesitas crear la migración con `alembic revision --autogenerate -m "Initial migration"` y luego `alembic upgrade head`
- **Dos terminales:** Necesitas DOS terminales abiertas (una para backend, otra para frontend)

