# 📖 Si el Script se Cierra Muy Rápido

## 🔍 Problema
El script se ejecuta y se cierra inmediatamente sin dar tiempo de leer los mensajes.

## ✅ Soluciones

### Opción 1: Usar el Script Verbose (Recomendado)
1. En lugar de `start_frontend.bat`
2. Usa: `start_frontend_verbose.bat`
3. Este script muestra mensajes detallados y espera entre pasos

### Opción 2: Ejecutar desde Terminal
1. Abre PowerShell o CMD
2. Ve al directorio:
   ```powershell
   cd C:\Users\pablo\Desktop\appgynsys\frontend
   ```
3. Ejecuta el script:
   ```powershell
   .\start_frontend.bat
   ```
4. Así podrás ver todos los mensajes

### Opción 3: Ejecutar Comandos Manualmente
En PowerShell o CMD:

```powershell
cd C:\Users\pablo\Desktop\appgynsys\frontend

# Verificar Node.js
node --version
npm --version

# Si funcionan, instalar dependencias
npm install

# Iniciar servidor
npm run dev
```

### Opción 4: Agregar Pausa al Script
Si quieres modificar el script para que espere:

1. Abre `start_frontend.bat` con el Bloc de Notas
2. Al final, antes de `pause`, agrega:
   ```batch
   timeout /t 5 /nobreak
   ```
3. Guarda el archivo

---

## 🎯 Recomendación

**Usa el script verbose** (`start_frontend_verbose.bat`) que ya creé. Muestra todos los pasos y mensajes claramente.

---

## 📝 Nota

Si el script se cierra muy rápido, generalmente es porque:
- Node.js no está en el PATH
- Hay un error que hace que se cierre antes del `pause`
- La terminal se cierra automáticamente

La solución es ejecutarlo desde una terminal abierta manualmente.

