@echo off
title GynSys Backend
cd /d "%~dp0backend"
echo ========================================
echo Iniciando GynSys Backend
echo ========================================
echo.
call "%~dp0backend\venv\Scripts\activate.bat"
echo.
echo Servidor disponible en: http://localhost:8000
echo Documentacion API en: http://localhost:8000/docs
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
uvicorn app.main:app --reload

