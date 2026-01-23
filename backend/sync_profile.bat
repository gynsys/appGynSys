@echo off
echo Sincronizando perfil de Dra. Mariel Herrera con la plantilla...
docker-compose exec -T backend python extract_mariel_template.py
if %ERRORLEVEL% EQU 0 (
    echo Perfil sincronizado con exito en 'mariel_herrera_template.json'.
) else (
    echo Error al sincronizar perfil.
)
pause
