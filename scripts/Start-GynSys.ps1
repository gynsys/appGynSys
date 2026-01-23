# Script para iniciar GynSys (Backend + Frontend) de forma robusta
# Detiene procesos anteriores y lanza nuevas ventanas.

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   INICIANDO GYNSYS - WEB APP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Detener procesos anteriores (opcional, para limpiar puertos)
Write-Host "[-] Deteniendo procesos antiguos (node, uvicorn)..." -ForegroundColor Yellow
Stop-Process -Name "node" -ErrorAction SilentlyContinue
Stop-Process -Name "python" -ErrorAction SilentlyContinue
# Nota: Esto mata todos los python/node. Si tienes otros proyectos corriendo, comenta estas líneas.

# 2. Iniciar Backend
Write-Host "[+] Iniciando Backend (Puerto 8000)..." -ForegroundColor Green
$backendCmd = "cd 'c:\Users\pablo\Desktop\appgynsys\backend'; & 'c:\Users\pablo\Desktop\gynsys\venv_win\Scripts\Activate.ps1'; uvicorn app.main:app --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$backendCmd"

# 3. Iniciar Frontend
Write-Host "[+] Iniciando Frontend (Puerto 5173)..." -ForegroundColor Green
$frontendCmd = "cd 'c:\Users\pablo\Desktop\appgynsys\frontend'; pnpm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$frontendCmd"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SISTEMA INICIADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:5173"
Write-Host ""
