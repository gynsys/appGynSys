@echo off
echo ========================================
echo Aplicando Migracion de Testimonials y Gallery
echo ========================================
echo.

cd /d "%~dp0"
call ..\..\gynsys\venv\Scripts\activate.bat

echo Aplicando migracion...
python -m alembic upgrade head

echo.
echo ========================================
echo Migracion completada!
echo ========================================
pause

