@echo off
echo ========================================
echo Reiniciando Frontend de GynSys
echo ========================================
echo.

cd /d "%~dp0"

echo Deteniendo procesos de Node...
taskkill /F /IM node.exe 2>nul

echo.
echo Esperando 2 segundos...
timeout /t 2 /nobreak >nul

echo.
echo Iniciando servidor de desarrollo...
npm run dev

pause

