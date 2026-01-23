#!/bin/bash
# Simple SQLite Backup Script for AppGynSys

# Configuration
DB_PATH="medical.db" # Adjust to actual DB path defined in .env or config
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/app_backup_$TIMESTAMP.db"

# Create backup dir
mkdir -p $BACKUP_DIR

# Dump database (safe online backup for SQLite)
if [ -f "$DB_PATH" ]; then
    sqlite3 $DB_PATH ".backup '$BACKUP_FILE'"
    
    # Compress
    gzip $BACKUP_FILE
    
    # Retention (keep last 7 days)
    find $BACKUP_DIR -name "app_backup_*.db.gz" -mtime +7 -delete
    
    echo "Backup created: $BACKUP_FILE.gz"
else
    echo "Database file not found at $DB_PATH"
    exit 1
fi

# TODO: Add S3 upload command here
# aws s3 cp $BACKUP_FILE.gz s3://my-bucket/backups/
