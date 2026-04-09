#!/bin/bash
# Script de diagnóstico corregido para el VPS
echo "--- Notificaciones Pendientes ---"
docker exec appgynsys-db-1 psql -U postgres -d gynsys -t -c "SELECT count(*) FROM pending_notifications WHERE status = 'pending';"
echo "--- Notificaciones Procesando ---"
docker exec appgynsys-db-1 psql -U postgres -d gynsys -t -c "SELECT count(*) FROM pending_notifications WHERE status = 'processing';"
echo "--- Errores Recientes (últimas 5) ---"
docker exec appgynsys-db-1 psql -U postgres -d gynsys -c "SELECT id, notification_rule_id, error_message, sent_at FROM notification_logs WHERE error_message IS NOT NULL ORDER BY sent_at DESC LIMIT 5;"
echo "--- Últimas 5 enviadas ---"
docker exec appgynsys-db-1 psql -U postgres -d gynsys -c "SELECT id, status, channel_used, sent_at FROM notification_logs ORDER BY sent_at DESC LIMIT 5;"
