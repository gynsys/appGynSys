DELETE FROM notification_rules a USING notification_rules b
WHERE a.id < b.id
AND a.tenant_id = b.tenant_id
AND a.notification_type = b.notification_type;
