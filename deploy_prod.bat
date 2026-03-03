@echo off
set REMOTE=root@167.172.115.154
set REMOTE_PATH=/opt/appgynsys/backend/app/services/notifications

echo [1/8] Preparando directorios...
ssh %REMOTE% "mkdir -p %REMOTE_PATH%"

echo [2/8] Subiendo submódulos...

powershell -Command "[System.IO.File]::WriteAllText('base.b64', [Convert]::ToBase64String([IO.File]::ReadAllBytes('backend\app\services\notifications\base.py')))"
ssh %REMOTE% "cat > %REMOTE_PATH%/base.py.b64" < base.b64
ssh %REMOTE% "base64 -d %REMOTE_PATH%/base.py.b64 > %REMOTE_PATH%/base.py"

powershell -Command "[System.IO.File]::WriteAllText('registry.b64', [Convert]::ToBase64String([IO.File]::ReadAllBytes('backend\app\services\notifications\registry.py')))"
ssh %REMOTE% "cat > %REMOTE_PATH%/registry.py.b64" < registry.b64
ssh %REMOTE% "base64 -d %REMOTE_PATH%/registry.py.b64 > %REMOTE_PATH%/registry.py"

powershell -Command "[System.IO.File]::WriteAllText('context.b64', [Convert]::ToBase64String([IO.File]::ReadAllBytes('backend\app\services\notifications\context.py')))"
ssh %REMOTE% "cat > %REMOTE_PATH%/context.py.b64" < context.b64
ssh %REMOTE% "base64 -d %REMOTE_PATH%/context.py.b64 > %REMOTE_PATH%/context.py"

powershell -Command "[System.IO.File]::WriteAllText('sender.b64', [Convert]::ToBase64String([IO.File]::ReadAllBytes('backend\app\services\notifications\sender.py')))"
ssh %REMOTE% "cat > %REMOTE_PATH%/sender.py.b64" < sender.b64
ssh %REMOTE% "base64 -d %REMOTE_PATH%/sender.py.b64 > %REMOTE_PATH%/sender.py"

powershell -Command "[System.IO.File]::WriteAllText('processor.b64', [Convert]::ToBase64String([IO.File]::ReadAllBytes('backend\app\services\notifications\processor.py')))"
ssh %REMOTE% "cat > %REMOTE_PATH%/processor.py.b64" < processor.b64
ssh %REMOTE% "base64 -d %REMOTE_PATH%/processor.py.b64 > %REMOTE_PATH%/processor.py"

powershell -Command "[System.IO.File]::WriteAllText('health.b64', [Convert]::ToBase64String([IO.File]::ReadAllBytes('backend\app\services\notifications\health.py')))"
ssh %REMOTE% "cat > %REMOTE_PATH%/health.py.b64" < health.b64
ssh %REMOTE% "base64 -d %REMOTE_PATH%/health.py.b64 > %REMOTE_PATH%/health.py"

powershell -Command "[System.IO.File]::WriteAllText('init.b64', [Convert]::ToBase64String([IO.File]::ReadAllBytes('backend\app\services\notifications\__init__.py')))"
ssh %REMOTE% "cat > %REMOTE_PATH%/__init__.py.b64" < init.b64
ssh %REMOTE% "base64 -d %REMOTE_PATH%/__init__.py.b64 > %REMOTE_PATH%/__init__.py"

echo [3/8] Limpiando temporales remotos...
ssh %REMOTE% "rm %REMOTE_PATH%/*.b64"

echo [4/8] Respaldando archivo monolítico...
ssh %REMOTE% "mv /opt/appgynsys/backend/app/services/notifications.py /opt/appgynsys/backend/app/services/notifications_backup.py"

echo [5/8] Reiniciando servicios...
ssh %REMOTE% "cd /opt/appgynsys && docker compose restart backend celery_worker celery_beat"

echo [6/8] Verificando salud...
ssh %REMOTE% "docker ps"
ssh %REMOTE% "docker logs appgynsys-backend-1 --tail 20"

echo [7/8] Limpiando archivos b64 locales...
del base.b64 registry.b64 context.b64 sender.b64 processor.b64 health.b64 init.b64

echo [8/8] Despliegue completado satisfactoriamente.
