-- Activar módulo recommendations para Mariel Herrera (tenant_id = 4)
INSERT INTO tenant_modules (tenant_id, module_id, is_enabled, created_at)
SELECT 4, id, true, NOW()
FROM modules 
WHERE code = 'recommendations'
AND NOT EXISTS (
    SELECT 1 FROM tenant_modules 
    WHERE tenant_id = 4 AND module_id = (SELECT id FROM modules WHERE code = 'recommendations')
);

-- Verificar
SELECT d.nombre_completo, m.code, tm.is_enabled
FROM tenant_modules tm
JOIN doctors d ON d.id = tm.tenant_id
JOIN modules m ON m.id = tm.module_id
WHERE d.id = 4
ORDER BY m.code;
