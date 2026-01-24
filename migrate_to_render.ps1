# Script to migrate local GynSys Docker DB to Render
# Usage: .\migrate_to_render.ps1

Write-Host "🚀 Iniciando Migración de Base de Datos a Render..." -ForegroundColor Cyan

# 1. Get Render External URL
Write-Host "`n1. Necesito la URL EXTERNA de tu base de datos Render." -ForegroundColor Yellow
Write-Host "   Ve a Render -> Dashboard -> PostgreSQL -> Connect -> External Connection"
Write-Host "   Debe verse como: postgres://usuario:password@hostname.render.com/base_datos"
$RenderURL = Read-Host -Prompt "   Pega la URL aquí"

if ([string]::IsNullOrWhiteSpace($RenderURL)) {
    Write-Host "❌ Debes proporcionar una URL válida." -ForegroundColor Red
    exit 1
}

# 2. Dump Local DB
Write-Host "`n2. Creando respaldo local (backup.sql) desde Docker..." -ForegroundColor Yellow
$ContainerName = docker ps --format "{{.Names}}" | Select-String "db" | Select-Object -First 1
if (-not $ContainerName) {
    Write-Host "⚠️ No encontré el contenedor de base de datos ejecutándose." -ForegroundColor Red
    Write-Host "   Asegúrate de que 'docker-compose up' esté corriendo."
    exit 1
}
Write-Host "   Contenedor detectado: $ContainerName"

# Dump command: clean (drops objects) and if-exists to avoid errors on init
docker exec -i $ContainerName pg_dump -U postgres -d gynsys --clean --if-exists --no-owner --no-privileges > backup.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Respaldo create exitosamente: backup.sql" -ForegroundColor Green
}
else {
    Write-Host "❌ Error creando respaldo. Verifica que el contenedor esté sano." -ForegroundColor Red
    exit 1
}

# 3. Restore to Render
Write-Host "`n3. Restaurando backup en Render (esto puede tardar unos minutos)..." -ForegroundColor Yellow
Write-Host "   Usando contenedor temporal de 'postgres:15-alpine' para enviar los datos..."

# Use Docker to run psql and pipe the file content
# requires putting the file into the container or piping via stdin. 
# 'Get-Content ... | docker run ...' works in PowerShell for text but tricky with specialized encoding.
# Better: Mount the file.

docker run --rm -v "${PWD}/backup.sql:/backup.sql" -e PG_URL=$RenderURL postgres:15-alpine sh -c "psql `$PG_URL < /backup.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!" -ForegroundColor Green
    Write-Host "   Tu Render ahora tiene los mismos datos que tu Local."
    Write-Host "   Recarga la página de Admin en Netlify para verificar."
}
else {
    Write-Host "`n❌ Error durante la restauración." -ForegroundColor Red
    Write-Host "   Verifica que la URL Externa sea correcta y accesible."
}
