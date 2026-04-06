#!/bin/bash
cd /opt/appgynsys
docker compose exec -T db psql -U postgres -d gynsys -c "SELECT id, category, type, text FROM preconsultation_questions ORDER BY id ASC LIMIT 100;"
