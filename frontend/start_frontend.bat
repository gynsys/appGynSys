@echo off
REM Evitar que se cierre automaticamente
setlocal enabledelayedexpansion

echo ========================================
echo Iniciando GynSys Frontend
echo ========================================
echo.
echo Espera mientras verifico Node.js...
timeout /t 2 /nobreak >nul
echo.

REM Verificar si Node.js esta instalado
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo Node.js no se encuentra en el PATH
    echo ========================================
    echo.
    echo Esto puede pasar si:
    echo 1. Acabas de instalar Node.js
    echo 2. No cerraste y abriste una nueva terminal
    echo 3. El PATH no se actualizo
    echo.
    echo SOLUCIONES:
    echo.
    echo Opcion 1: Cerrar y abrir nueva terminal (RECOMENDADO)
    echo   1. Cierra esta ventana
    echo   2. Abre una nueva terminal/PowerShell
    echo   3. Ejecuta este script nuevamente
    echo.
    echo Opcion 2: Reiniciar la computadora
    echo   - A veces Windows necesita reiniciar para reconocer nuevos programas
    echo.
    echo Opcion 3: Verificar instalacion manualmente
    echo   - Abre una nueva terminal
    echo   - Ejecuta: node --version
    echo   - Si funciona, el problema es solo esta ventana
    echo.
    echo Opcion 4: Usar ruta completa
    echo   - El script intentara usar la ruta completa de Node.js
    echo.
    echo Intentando usar ruta completa de Node.js...
    echo.
    
    REM Intentar rutas comunes de Node.js
    if exist "C:\Program Files\nodejs\node.exe" (
        set "NODE_PATH=C:\Program Files\nodejs"
        set "PATH=%NODE_PATH%;%PATH%"
        echo Node.js encontrado en: C:\Program Files\nodejs
        goto :found_node
    )
    
    if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "NODE_PATH=C:\Program Files (x86)\nodejs"
        set "PATH=%NODE_PATH%;%PATH%"
        echo Node.js encontrado en: C:\Program Files (x86)\nodejs
        goto :found_node
    )
    
    echo.
    echo No se encontro Node.js en las rutas comunes.
    echo Por favor, cierra esta ventana y abre una nueva terminal.
    echo.
    pause
    exit /b 1
    
    :found_node
    echo Node.js encontrado! Continuando...
    echo.
)

REM Verificar si pnpm esta instalado
where pnpm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo ERROR: pnpm no esta instalado
    echo ========================================
    echo.
    echo Este proyecto usa pnpm en lugar de npm.
    echo Instala pnpm con: npm install -g pnpm
    echo.
    pause
    exit /b 1
)

echo Node.js y pnpm encontrados correctamente.
echo.

echo Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias pnpm (esto puede tardar unos minutos)...
    call pnpm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERROR al instalar dependencias
        echo.
        pause
        exit /b 1
    )
)

echo.
echo Iniciando servidor de desarrollo...
echo Frontend disponible en: http://localhost:5173
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

call pnpm dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo ERROR al iniciar el servidor
    echo ========================================
    echo.
    echo Revisa los mensajes de error arriba
    echo.
)

echo.
echo ========================================
echo Presiona cualquier tecla para cerrar...
echo ========================================
pause >nul

