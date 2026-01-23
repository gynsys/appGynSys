@echo off
echo ========================================
echo Solucionando Problema de Actualizacion
echo ========================================
echo.

echo Paso 1: Deteniendo procesos de Node...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Paso 2: Limpiando cache de Vite...
cd /d "%~dp0"
if exist node_modules\.vite (
    rmdir /s /q node_modules\.vite
    echo Cache de Vite eliminado
)

echo.
echo Paso 3: Iniciando servidor...
pnpm dev

pause

