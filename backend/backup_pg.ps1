# Backup Script for AppGynSys PostgreSQL (Docker)
# Usage: .\backup_pg.ps1

$ErrorActionPreference = "Continue"

# Configuration
$SCRIPT_DIR = $PSScriptRoot
$BACKUP_DIR = Join-Path $SCRIPT_DIR "backups"
$UPLOADS_DIR = Join-Path $SCRIPT_DIR "uploads"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = Join-Path $BACKUP_DIR "gynsys_db_$TIMESTAMP.sql"
$FINAL_ZIP = Join-Path $BACKUP_DIR "gynsys_full_backup_$TIMESTAMP.zip"

# Navigate to script directory to ensure docker-compose works
Set-Location $SCRIPT_DIR

# Create backup directory if it doesn't exist
if (-not (Test-Path -Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Host "Created backup directory: $BACKUP_DIR"
}

Write-Host "Starting FULL backup (Database + Files)..."

try {
    # 1. Database Backup
    Write-Host "Step 1: Backing up Database..."
    docker-compose exec -T db pg_dump -U postgres gynsys > $BACKUP_FILE
    
    if ($LASTEXITCODE -eq 0 -and (Test-Path $BACKUP_FILE)) {
        Write-Host "Database dump created: $BACKUP_FILE"
        
        # 2. File Compression (DB + Uploads)
        Write-Host "Step 2: Compressing Database and Uploads..."
        
        # Create a temporary list of files to compress
        # We compress the SQL file AND the uploads folder
        
        # Determine items to zip
        $itemsToZip = @($BACKUP_FILE)
        if (Test-Path $UPLOADS_DIR) {
            Write-Host "Found uploads directory, including in backup."
            $itemsToZip += $UPLOADS_DIR
        }
        else {
            Write-Warning "Uploads directory not found at $UPLOADS_DIR"
        }

        # Compress
        Compress-Archive -Path $itemsToZip -DestinationPath $FINAL_ZIP -Force
        
        # Clean up raw SQL file
        Remove-Item $BACKUP_FILE
        
        Write-Host "FULL BACKUP SUCCESSFUL: $FINAL_ZIP"
        
        # Retention Policy: Keep last 14 days
        $LimitDate = (Get-Date).AddDays(-14)
        Get-ChildItem -Path $BACKUP_DIR -Filter "gynsys_*.zip" | Where-Object { $_.LastWriteTime -lt $LimitDate } | Remove-Item
        Write-Host "Cleaned up old backups (older than 14 days)."
    }
    else {
        Write-Error "Failed to create DB backup. Ensure 'db' service is running."
    }
}
catch {
    Write-Error "An error occurred during backup: $_"
}
