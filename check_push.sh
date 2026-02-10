#!/bin/bash
docker exec appgynsys-backend-1 psql -U gynsys_user -d gynsys_db -c "
SELECT id, email, nombre_completo, 
CASE WHEN push_subscription IS NOT NULL THEN 'ENABLED' ELSE 'DISABLED' END as push_status 
FROM cycle_users 
WHERE push_subscription IS NOT NULL;"
