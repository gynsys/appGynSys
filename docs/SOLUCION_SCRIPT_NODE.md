# 🔧 Solución: Script No Detecta Node.js

## ❌ Problema
El script dice que Node.js no está instalado, pero acabas de instalarlo.

## ✅ Solución Rápida

### Opción 1: Cerrar y Abrir Nueva Terminal (MÁS FÁCIL)

1. **Cierra esta ventana** completamente
2. **Abre una NUEVA** terminal/PowerShell/CMD
3. Ve a: `C:\Users\pablo\Desktop\appgynsys\frontend`
4. Ejecuta: `start_frontend.bat`
5. ✅ Ahora debería funcionar

---

### Opción 2: Verificar Manualmente

1. Abre una **NUEVA** terminal (PowerShell o CMD)
2. Ejecuta:
   ```powershell
   node --version
   ```
3. Si muestra un número (ej: `v20.10.0`), Node.js está instalado
4. Si dice "no se reconoce", necesitas reiniciar la computadora

---

### Opción 3: Reiniciar la Computadora

A veces Windows necesita reiniciar para reconocer nuevos programas:

1. **Guarda todo tu trabajo**
2. **Reinicia** tu computadora
3. Después de reiniciar, prueba el script nuevamente

---

### Opción 4: Usar PowerShell Directamente

En lugar del script .bat, usa PowerShell:

1. Abre **PowerShell**
2. Ejecuta:
   ```powershell
   cd C:\Users\pablo\Desktop\appgynsys\frontend
   node --version
   npm --version
   ```
3. Si funcionan, entonces:
   ```powershell
   npm install
   npm run dev
   ```

---

## 🔍 Verificar Instalación

En una **NUEVA** terminal, ejecuta:

```powershell
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar ubicación
where node
```

Si todos funcionan, el problema es solo que la ventana anterior no se actualizó.

---

## ✅ Después de Verificar

Una vez que `node --version` funcione en una nueva terminal:

1. Ve a: `C:\Users\pablo\Desktop\appgynsys\frontend`
2. Ejecuta: `start_frontend.bat`
3. O ejecuta manualmente:
   ```powershell
   npm install
   npm run dev
   ```

---

## 📝 Nota

El script actualizado ahora intenta buscar Node.js en rutas comunes si no está en el PATH. Pero la mejor solución es **cerrar y abrir una nueva terminal**.

