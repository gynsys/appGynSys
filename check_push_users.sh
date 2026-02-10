#!/bin/bash
docker exec appgynsys-backend-1 psql -U gynsys_user -d gynsys_db -c "SELECT COUNT(*) as users_with_push FROM cycle_users WHERE push_subscription IS NOT NULL;"
docker exec appgynsys-backend-1 psql -U gynsys_user -d gynsys_db -c "SELECT id, email, nombre_completo FROM cycle_users WHERE push_subscription IS NOT NULL LIMIT 5;"
