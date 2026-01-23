@echo off
echo ========================================
echo Iniciando GynSys - Backend y Frontend
echo ========================================
echo.


echo Abriendo Backend en nueva ventana...
start "GynSys Backend" cmd /k "cd /d %~dp0backend && call ..\.venv\Scripts\activate && echo Iniciando servidor FastAPI... && uvicorn app.main:app --reload"

echo Abriendo Frontend en nueva ventana...
start "GynSys Frontend" cmd /k "cd /d %~dp0frontend && echo Iniciando servidor Vite... && pnpm run dev"

echo.
echo ========================================
echo Servidores iniciados!
echo ========================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo Docs API: http://localhost:8000/docs
echo.
echo Las ventanas se abriran automaticamente.
echo Presiona cualquier tecla para cerrar este mensaje...
pause >nul

