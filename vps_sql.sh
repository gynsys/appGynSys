#!/bin/bash
cd /opt/appgynsys
docker compose exec -T db psql -U postgres -d gynsys -c "ALTER TABLE campaign_contact ADD COLUMN IF NOT EXISTS ci VARCHAR(50);"
docker compose exec -T db psql -U postgres -d gynsys -c "ALTER TABLE campaign_contact ADD COLUMN IF NOT EXISTS city VARCHAR(255);"
docker compose restart backend
echo "Database patched and backend restarted successfully."
