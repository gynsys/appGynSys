@echo off
title GynSys Frontend
cd /d "%~dp0frontend"
echo ========================================
echo Iniciando GynSys Frontend
echo ========================================
echo.
echo Servidor disponible en: http://localhost:5173
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
pnpm run dev

