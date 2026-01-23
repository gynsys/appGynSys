@echo off
echo ========================================
echo Importando FAQs a la base de datos
echo ========================================
echo.

REM Activar entorno virtual
if exist "..\..\gynsys\venv\Scripts\activate.bat" (
    echo Activando entorno virtual desde gynsys...
    call ..\..\gynsys\venv\Scripts\activate.bat
) else if exist "..\venv\Scripts\activate.bat" (
    echo Activando entorno virtual...
    call ..\venv\Scripts\activate.bat
) else if exist "venv\Scripts\activate.bat" (
    echo Activando entorno virtual local...
    call venv\Scripts\activate.bat
) else (
    echo ERROR: No se encontro el entorno virtual
    pause
    exit /b 1
)

echo.
echo Ejecutando script de importacion...
echo.

REM Cambiar al directorio backend
cd /d %~dp0\..

REM Ejecutar el script
python scripts\import_faqs.py --slug mariel-herrera

echo.
pause

