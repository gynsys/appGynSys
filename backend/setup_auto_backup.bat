@echo off
set SCRIPT_PATH=C:\Users\pablo\Documents\appgynsys\backend\backup_pg.ps1
set TASK_NAME=GynSysBackup

echo Creando tarea programada para ejecutar el respaldo diariamente a las 12:00 PM...

schtasks /create /tn "%TASK_NAME%" /tr "powershell.exe -ExecutionPolicy Bypass -File \"%SCRIPT_PATH%\"" /sc daily /st 12:00 /f

if %errorlevel% equ 0 (
    echo.
    echo [EXITO] Tarea "%TASK_NAME%" creada correctamente.
    echo El respaldo se ejecutara todos los dias a las 12:00 PM.
) else (
    echo.
    echo [ERROR] No se pudo crear la tarea. Intenta ejecutar este script como Administrador.
)
pause
