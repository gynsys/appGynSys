#!/bin/bash
cd /opt/appgynsys
docker compose exec -T db psql -U postgres -d gynsys -c "SELECT DISTINCT doctor_id FROM preconsultation_questions WHERE doctor_id IS NOT NULL;"
