UPDATE notification_rules SET message_text_template = NULL WHERE tenant_id IS NULL;
SELECT COUNT(*) FROM notification_rules WHERE message_text_template IS NULL AND tenant_id IS NULL;
