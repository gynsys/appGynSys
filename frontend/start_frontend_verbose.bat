@echo off
REM Script con mensajes detallados para debug
setlocal enabledelayedexpansion

echo ========================================
echo Iniciando GynSys Frontend (Modo Verbose)
echo ========================================
echo.
echo Espera 3 segundos para leer los mensajes...
timeout /t 3 /nobreak
echo.

echo [1/5] Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo ERROR: Node.js no encontrado
    echo ========================================
    echo.
    echo Intentando buscar en rutas comunes...
    
    if exist "C:\Program Files\nodejs\node.exe" (
        echo Node.js encontrado en: C:\Program Files\nodejs
        set "PATH=C:\Program Files\nodejs;%PATH%"
        goto :found_node
    )
    
    if exist "C:\Program Files (x86)\nodejs\node.exe" (
        echo Node.js encontrado en: C:\Program Files (x86)\nodejs
        set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
        goto :found_node
    )
    
    echo.
    echo Node.js NO se encontro en ninguna ruta comun.
    echo.
    echo SOLUCION:
    echo 1. Abre una NUEVA terminal (PowerShell o CMD)
    echo 2. Ejecuta: node --version
    echo 3. Si funciona, ejecuta este script desde esa terminal
    echo 4. Si no funciona, reinicia tu computadora
    echo.
    pause
    exit /b 1
)

:found_node
echo [OK] Node.js encontrado
node --version
echo.

echo [2/5] Verificando npm...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm no encontrado
    echo npm deberia venir con Node.js
    pause
    exit /b 1
)
echo [OK] npm encontrado
npm --version
echo.

echo [3/5] Verificando directorio actual...
cd /d "%~dp0"
echo Directorio: %CD%
echo.

echo [4/5] Verificando dependencias...
if not exist "node_modules" (
    echo node_modules no existe. Instalando dependencias...
    echo Esto puede tardar 1-2 minutos...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Fallo la instalacion de dependencias
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas
) else (
    echo [OK] Dependencias ya instaladas
)
echo.

echo [5/5] Iniciando servidor de desarrollo...
echo.
echo ========================================
echo Frontend disponible en: http://localhost:5173
echo ========================================
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
timeout /t 2 /nobreak >nul

call npm run dev

echo.
echo ========================================
echo El servidor se detuvo
echo ========================================
pause

