#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/indolelang"
DB_CONTAINER="indolelang_postgres_prod"
DB_USER="postgres"
DB_NAME="indolelang_prod"
DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

echo "Starting database backup for $DB_NAME..."

# Execute pg_dump inside Postgres container and compress it
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $BACKUP_FILE"
    
    # Retain only last 7 days of backups
    echo "Cleaning up backups older than 7 days..."
    find "$BACKUP_DIR" -type f -name "db_backup_*.sql.gz" -mtime +7 -delete
    
    echo "Cleanup finished."
else
    echo "Error: Database backup failed!"
    exit 1
fi
