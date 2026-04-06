#!/bin/bash
cd /opt/appgynsys
echo "Checking Patient table columns..."
docker compose exec -T db psql -U postgres -d gynsys -c "\d patients"
echo "Searching for Adis in patients table..."
docker compose exec -T db psql -U postgres -d gynsys -c "SELECT id, name, email, phone FROM patients WHERE name ILIKE '%Adis%';"
echo "Searching for Adis in consultations table..."
docker compose exec -T db psql -U postgres -d gynsys -c "SELECT id, patient_name, patient_email, patient_ci, address FROM consultations WHERE patient_name ILIKE '%Adis%';"
