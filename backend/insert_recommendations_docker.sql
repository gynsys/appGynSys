-- Insert recommendations module into Docker database
INSERT INTO modules (name, code, description, is_active, created_at)
SELECT 'Recomendaciones', 'recommendations', 'Gestión de productos recomendados', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM modules WHERE code = 'recommendations');

-- Verify total active modules
SELECT id, code, name, is_active FROM modules WHERE is_active = true ORDER BY id;
