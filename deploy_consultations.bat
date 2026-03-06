@echo off
set REMOTE=root@167.172.115.154

echo [1/5] Preparando base64...
powershell -Command "[System.IO.File]::WriteAllText('service.b64', [Convert]::ToBase64String([IO.File]::ReadAllBytes('backend\app\services\consultation_service.py')))"
powershell -Command "[System.IO.File]::WriteAllText('endpoints.b64', [Convert]::ToBase64String([IO.File]::ReadAllBytes('backend\app\api\v1\endpoints\consultations.py')))"
powershell -Command "[System.IO.File]::WriteAllText('api.b64', [Convert]::ToBase64String([IO.File]::ReadAllBytes('backend\app\api\v1\api.py')))"

echo [2/5] Subiendo archivos...
ssh %REMOTE% "cat > /opt/appgynsys/backend/app/services/consultation_service.py.b64" < service.b64
ssh %REMOTE% "cat > /opt/appgynsys/backend/app/api/v1/endpoints/consultations.py.b64" < endpoints.b64
ssh %REMOTE% "cat > /opt/appgynsys/backend/app/api/v1/api.py.b64" < api.b64

echo [3/5] Decodificando en remoto...
ssh %REMOTE% "base64 -d /opt/appgynsys/backend/app/services/consultation_service.py.b64 > /opt/appgynsys/backend/app/services/consultation_service.py"
ssh %REMOTE% "base64 -d /opt/appgynsys/backend/app/api/v1/endpoints/consultations.py.b64 > /opt/appgynsys/backend/app/api/v1/endpoints/consultations.py"
ssh %REMOTE% "base64 -d /opt/appgynsys/backend/app/api/v1/api.py.b64 > /opt/appgynsys/backend/app/api/v1/api.py"

echo [4/5] Limpiando...
ssh %REMOTE% "rm /opt/appgynsys/backend/app/services/consultation_service.py.b64 /opt/appgynsys/backend/app/api/v1/endpoints/consultations.py.b64 /opt/appgynsys/backend/app/api/v1/api.py.b64"
del service.b64 endpoints.b64 api.b64

echo [5/5] Reiniciando backend...
ssh %REMOTE% "cd /opt/appgynsys && docker compose restart backend"

echo Despliegue de consultas completado.
