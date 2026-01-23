@echo off
echo ========================================
echo Reiniciando Frontend - Paso a Paso
echo ========================================
echo.

echo Paso 1: Deteniendo procesos de Node...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo Procesos detenidos.
echo.

echo Paso 2: Limpiando cache...
cd /d "%~dp0"
if exist node_modules\.vite (
    rmdir /s /q node_modules\.vite
    echo Cache eliminado.
) else (
    echo No hay cache que limpiar.
)
echo.

echo Paso 3: Iniciando servidor...
echo.
echo El servidor se iniciara en http://localhost:5173
echo Presiona Ctrl+C para detenerlo cuando termines.
echo.
pause
pnpm dev

