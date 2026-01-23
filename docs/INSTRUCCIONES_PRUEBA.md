# 🎯 Instrucciones para Probar - Método Más Simple

## ⚡ Inicio Rápido (2 Clicks)

### 1️⃣ Iniciar Backend
1. Ve a: `C:\Users\pablo\Desktop\appgynsys\backend`
2. **Doble clic** en: `start_backend.bat`
3. Espera a que aparezca: "Uvicorn running on http://127.0.0.1:8000"

### 2️⃣ Iniciar Frontend (Nueva Ventana)
1. Ve a: `C:\Users\pablo\Desktop\appgynsys\frontend`
2. **Doble clic** en: `start_frontend.bat`
3. Espera a que aparezca: "Local: http://localhost:5173"

---

## 🌐 Probar en el Navegador

### Paso 1: Verificar Backend
- Abre: **http://localhost:8000/docs**
- Deberías ver la documentación de Swagger
- ✅ Si funciona, verás una interfaz con todos los endpoints

### Paso 2: Verificar Frontend
- Abre: **http://localhost:5173**
- Deberías ver la página de inicio de GynSys
- ✅ Si funciona, verás "Tu Clínica Digital en Minutos"

### Paso 3: Registrarse
1. Click en "Registrarse" o ve a: **http://localhost:5173/register**
2. Completa:
   - **Nombre Completo**: Dr. Juan Pérez
   - **Email**: juan@example.com
   - **Contraseña**: password123
3. Click en "Registrarse"
4. ✅ Debería redirigir al dashboard

### Paso 4: Ver Perfil Público
1. Después de registrarte, anota tu slug (ej: `dr-juan-perez`)
2. Ve a: **http://localhost:5173/dr/dr-juan-perez**
3. ✅ Deberías ver tu perfil público personalizado

---

## ❌ Si Algo No Funciona

### Backend no inicia
- Verifica que Python esté instalado
- Verifica que el entorno virtual exista en `C:\Users\pablo\Desktop\gynsys\venv`
- Si no existe, el script intentará crear uno nuevo

### Frontend no inicia
- Verifica que Node.js esté instalado: https://nodejs.org/
- El script instalará dependencias automáticamente la primera vez

### Error de migración
- Si ves error de "table already exists", está bien, significa que ya existe
- Si ves otro error, ejecuta manualmente:
  ```powershell
  cd C:\Users\pablo\Desktop\appgynsys\backend
  alembic upgrade head
  ```

---

## ✅ Todo Listo

Una vez que ambos servidores estén corriendo:
- ✅ Backend: http://localhost:8000/docs
- ✅ Frontend: http://localhost:5173

¡Ya puedes probar el sistema completo!

