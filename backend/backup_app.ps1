# Backup Script for AppGynSys (PowerShell)
# Usage: .\backup_app.ps1

$ErrorActionPreference = "Stop"

# Configuration
$DB_PATH = "gynsys.db" # Adjust if using a different DB name or path
$BACKUP_DIR = "backups"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "$BACKUP_DIR\app_backup_$TIMESTAMP.db"

# Create backup directory if it doesn't exist
if (-not (Test-Path -Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Host "Created backup directory: $BACKUP_DIR"
}

# Check if DB exists
if (Test-Path -Path $DB_PATH) {
    Write-Host "Starting backup of $DB_PATH..."
    
    # Use sqlite3 command line if available for safe backup, otherwise copy
    if (Get-Command sqlite3 -ErrorAction SilentlyContinue) {
        sqlite3 $DB_PATH ".backup '$BACKUP_FILE'"
        Write-Host "Backup created using sqlite3: $BACKUP_FILE"
    } else {
        Copy-Item -Path $DB_PATH -Destination $BACKUP_FILE
        Write-Host "Backup created using Copy-Item (Warning: Ensure DB is not locked): $BACKUP_FILE"
    }

    # Compress (Optional - requires 7z or similar, or use Compress-Archive)
    Compress-Archive -Path $BACKUP_FILE -DestinationPath "$BACKUP_FILE.zip"
    Remove-Item $BACKUP_FILE
    Write-Host "Backup compressed: $BACKUP_FILE.zip"

    # Retention Policy: Keep last 7 days
    $LimitDate = (Get-Date).AddDays(-7)
    Get-ChildItem -Path $BACKUP_DIR -Filter "app_backup_*.zip" | Where-Object { $_.LastWriteTime -lt $LimitDate } | Remove-Item
    Write-Host "Cleaned up old backups."
    
} else {
    Write-Error "Database file not found at $DB_PATH"
}
