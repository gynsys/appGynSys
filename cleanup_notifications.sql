-- Contar reglas específicas antes de borrar
SELECT count(*) as specific_rules_before FROM notification_rules WHERE tenant_id IS NOT NULL;

-- Borrar reglas específicas (legacy per-doctor overrides)
DELETE FROM notification_rules WHERE tenant_id IS NOT NULL;

-- Verificar que solo quedaron las globales
SELECT count(*) as global_rules_remaining FROM notification_rules WHERE tenant_id IS NULL;
