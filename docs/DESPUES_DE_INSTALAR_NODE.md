# ✅ Después de Instalar Node.js - Pasos Siguientes

## 1️⃣ Verificar Instalación

Después de que termine la instalación:

1. **Cierra TODAS las ventanas de terminal/CMD abiertas**
2. Abre una **NUEVA** terminal (PowerShell o CMD)
3. Verifica que Node.js esté instalado:

```powershell
node --version
```

Deberías ver algo como: `v20.10.0` o similar

```powershell
npm --version
```

Deberías ver algo como: `10.2.3` o similar

```powershell
pnpm --version
```

Deberías ver algo como: `8.15.0` o similar

✅ **Si ves números de versión para Node.js, npm y pnpm, todo está instalado correctamente**

---

## 2️⃣ Iniciar el Frontend

Una vez verificado:

1. Ve a: `C:\Users\pablo\Desktop\appgynsys\frontend`
2. **Doble clic** en: `start_frontend.bat`
3. El script ahora:
   - ✅ Detectará Node.js
   - ✅ Instalará las dependencias automáticamente (primera vez)
   - ✅ Iniciará el servidor de desarrollo

---

## 3️⃣ Verificar que Funciona

Cuando el frontend inicie, verás algo como:

```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

✅ **Abre tu navegador en:** http://localhost:5173

Deberías ver la página de inicio de GynSys.

---

## 4️⃣ Probar el Sistema Completo

### Backend (si no está corriendo):
1. Ve a: `C:\Users\pablo\Desktop\appgynsys\backend`
2. Doble clic en: `start_backend.bat`
3. Espera a ver: "Uvicorn running on http://127.0.0.1:8000"

### Frontend (ya lo iniciaste):
- Debería estar en: http://localhost:5173

### Probar Registro:
1. Ve a: http://localhost:5173/register
2. Completa el formulario
3. Click en "Registrarse"
4. ✅ Debería funcionar

---

## ⚠️ Si Algo No Funciona

### Si `node --version` no funciona:
- **Reinicia tu computadora** (a veces Windows necesita reiniciar para reconocer nuevos programas)
- O verifica que instalaste Node.js correctamente

### Si el frontend no inicia:
- Verifica que cerraste y abriste una nueva terminal
- Verifica que Node.js está instalado: `node --version`
- Revisa los mensajes de error en la terminal

---

## 📝 Notas

- La primera vez que ejecutes `start_frontend.bat`, instalará las dependencias (puede tardar 1-2 minutos)
- Después de eso, iniciará más rápido
- Necesitas **DOS terminales** abiertas: una para backend, otra para frontend

---

## ✅ Checklist

- [ ] Node.js instalado
- [ ] `node --version` funciona
- [ ] `npm --version` funciona
- [ ] Frontend inicia correctamente
- [ ] Puedo ver http://localhost:5173 en el navegador

¡Avísame cuando termine la instalación y probamos juntos!

