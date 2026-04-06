#!/bin/bash
cd /opt/appgynsys
docker compose exec -T db psql -U postgres -d gynsys -c "SELECT id, is_active FROM campaign_contact WHERE email = 'atemica@gmail.com';"
docker compose exec -T db psql -U postgres -d gynsys -c "SELECT id, email FROM patients WHERE nombre_completo ILIKE '%Adis%';"
