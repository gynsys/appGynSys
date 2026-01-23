-- Agregar módulo "Chat" al sistema
-- Estado inicial: DESACTIVADO (is_active = false)

INSERT INTO modules (name, description, code, is_active, created_at)
VALUES (
    'Chat en Vivo',
    'Sistema de mensajería en tiempo real para consultas entre doctores y pacientes',
    'chat',
    false,  -- DESACTIVADO por defecto
    NOW()
)
ON CONFLICT (code) DO UPDATE
SET 
    description = EXCLUDED.description,
    is_active = false;  -- Asegurar que esté desactivado

-- Verificar que se agregó correctamente
SELECT id, code, name, is_active 
FROM modules 
WHERE code = 'chat';
