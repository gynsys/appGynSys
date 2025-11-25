@echo off
echo ========================================
echo Iniciando GynSys Backend
echo ========================================
echo.

REM Activar entorno virtual si existe
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
    echo No se encontro entorno virtual. Creando uno nuevo...
    python -m venv venv
    call venv\Scripts\activate.bat
)

REM Verificar e instalar dependencias
echo.
echo Verificando dependencias...
python -c "import uvicorn" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Dependencias no encontradas. Instalando...
    echo Esto puede tardar unos minutos...
    pip install -r requirements.txt
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERROR al instalar dependencias
        echo.
        pause
        exit /b 1
    )
    echo Dependencias instaladas correctamente.
) else (
    echo Dependencias OK.
)

echo.
echo Verificando migraciones...
if not exist "gynsys.db" (
    echo Creando migracion inicial...
    alembic revision --autogenerate -m "Initial migration" >nul 2>&1
    alembic upgrade head >nul 2>&1
)

echo.
echo Iniciando servidor FastAPI...
echo Backend disponible en: http://localhost:8000
echo Documentacion API en: http://localhost:8000/docs
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

uvicorn app.main:app --reload

pause

