# 🔴 Cómo Cerrar el Servidor si Ctrl+C No Funciona

## Opción 1: Cerrar la Ventana de Terminal
- Simplemente cierra la ventana de PowerShell/CMD donde está corriendo el servidor
- Esto forzará el cierre del proceso

## Opción 2: Usar el Administrador de Tareas
1. Presiona `Ctrl + Shift + Esc` para abrir el Administrador de Tareas
2. Busca el proceso `python.exe` o `uvicorn`
3. Click derecho → "Finalizar tarea"

## Opción 3: Usar PowerShell para Matar el Proceso
Abre una **nueva** terminal de PowerShell y ejecuta:

```powershell
# Ver procesos de Python corriendo
Get-Process python | Where-Object {$_.Path -like "*gynsys*"}

# Matar todos los procesos de Python (CUIDADO: esto cierra TODOS los procesos Python)
Get-Process python | Stop-Process -Force

# O más específico, matar solo uvicorn
Get-Process | Where-Object {$_.ProcessName -eq "python" -and $_.CommandLine -like "*uvicorn*"} | Stop-Process -Force
```

## Opción 4: Usar el Puerto Específico
```powershell
# Encontrar el proceso usando el puerto 8000
netstat -ano | findstr :8000

# Esto mostrará el PID (Process ID), luego:
taskkill /PID <PID_NUMBER> /F
```

## Opción 5: Reiniciar la Terminal
- Cierra completamente la terminal
- Abre una nueva terminal
- El proceso debería haberse detenido

---

## ✅ Después de Cerrar

Una vez cerrado el servidor, puedes:
1. Crear la migración
2. Aplicar la migración
3. Reiniciar el servidor

---

## 💡 Prevención

Para evitar este problema en el futuro:
- Usa `Ctrl + C` una vez y espera unos segundos
- Si no responde, cierra la ventana directamente
- Considera usar un gestor de procesos como `pm2` o scripts batch

