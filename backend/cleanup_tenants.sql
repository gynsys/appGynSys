-- Limpiar configuración de tenants:
-- 1. Eliminar notificaciones del tenant incorrecto (admin-system id=3)
DELETE FROM notification_rules WHERE tenant_id = 3;

-- 2. Verificar que mariel-herrera (id=1) tiene las 12 notificaciones
SELECT notification_type, COUNT(*) 
FROM notification_rules 
WHERE tenant_id = 1 
GROUP BY notification_type
ORDER BY notification_type;

-- 3. Opcional: Actualizar admin-system para que no sea un tenant visible
-- Si admin@appgynsys.com es solo superadmin, podríamos marcarlo como inactivo o cambiar su rol
-- UPDATE doctors SET slug_url = 'superadmin' WHERE id = 3;
