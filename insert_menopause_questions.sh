#!/bin/bash
cd /opt/appgynsys
docker compose exec -T db psql -U postgres -d gynsys -c "
INSERT INTO preconsultation_questions (id, text, type, category, required, options, \"order\", is_active, doctor_id)
VALUES 
('Q_MENOPAUSE_1', '¿Ya has pasado por la etapa de la menopausia o el cese de tus ciclos?', 'boolean', 'gyn_history', false, NULL, 50, true, 1),
('Q_MENOPAUSE_2', '¿Presentas síntomas gastrointestinales?', 'select', 'general', false, '[\"Diarrea\", \"Estreñimiento\", \"Gases\", \"Distensión\", \"Dolor\"]', 51, true, 1),
('Q_MENOPAUSE_3', '¿Presentas calorones?', 'boolean', 'general', false, NULL, 52, true, 1),
('Q_MENOPAUSE_4', '¿Presentas pérdidas de concentración?', 'boolean', 'general', false, NULL, 53, true, 1),
('Q_MENOPAUSE_5', '¿Presentas molestias o resequedad vaginal?', 'boolean', 'general', false, NULL, 54, true, 1)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, options = EXCLUDED.options;
"
