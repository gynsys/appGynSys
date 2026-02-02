-- Insert default notification rules for doctor ID 3
-- Menstrual Cycle Calculator Rules
INSERT INTO notification_rules (tenant_id, name, notification_type, trigger_condition, channel, message_template, is_active) VALUES
(3, 'Día de Ovulación', 'cycle_phase', '{"is_ovulation_day": true}', 'dual', '<h1>🥚 Día de Ovulación</h1><p>Hola {patient_name}, hoy es tu día de ovulación. Es tu pico máximo de fertilidad.</p>', true),
(3, 'Inicio Ventana Fértil', 'cycle_phase', '{"is_fertile_start": true}', 'dual', '<h1>💚 Ventana Fértil</h1><p>Hola {patient_name}, hoy comienza tu ventana fértil. Tienes alta probabilidad de embarazo.</p>', true),
(3, 'Recordatorio de Período (1 día antes)', 'cycle_phase', '{"days_before_period": 1}', 'dual', '<h1>📅 Tu período llega pronto</h1><p>Hola {patient_name}, según tus predicciones, tu período debería comenzar mañana.</p>', true),
(3, 'Recordatorio de Período (3 días antes)', 'cycle_phase', '{"days_before_period": 3}', 'email', '<h1>📅 Recordatorio</h1><p>Hola {patient_name}, tu período debería comenzar en aproximadamente 3 días.</p>', true),
(3, 'Fase Folicular', 'cycle_phase', '{"cycle_day": 7}', 'email', '<h1>🌱 Fase Folicular</h1><p>Hola {patient_name}, estás en la fase folicular de tu ciclo.</p>', true),
(3, 'Fase Lútea', 'cycle_phase', '{"days_after_ovulation": 3}', 'email', '<h1>🌙 Fase Lútea</h1><p>Hola {patient_name}, estás en la fase lútea de tu ciclo.</p>', true),

-- Prenatal Rules
(3, 'Semana 12 - Primer Trimestre Completo', 'prenatal_milestone', '{"gestation_week": 12}', 'dual', '<h1>🎉 ¡Felicitaciones!</h1><p>Hola {patient_name}, has completado el primer trimestre. ¡Es un gran hito!</p>', true),
(3, 'Semana 20 - Mitad del Embarazo', 'prenatal_milestone', '{"gestation_week": 20}', 'dual', '<h1>🎊 ¡A mitad de camino!</h1><p>Hola {patient_name}, estás en la semana 20, ¡la mitad del embarazo!</p>', true),
(3, 'Semana 28 - Tercer Trimestre', 'prenatal_milestone', '{"gestation_week": 28}', 'dual', '<h1>🌟 Tercer Trimestre</h1><p>Hola {patient_name}, has entrado en el tercer y último trimestre.</p>', true),
(3, 'Semana 36 - Preparación para el Parto', 'prenatal_milestone', '{"gestation_week": 36}', 'dual', '<h1>👶 Muy Pronto</h1><p>Hola {patient_name}, estás en la semana 36. ¡Tu bebé llegará pronto!</p>', true),

-- System Rules
(3, 'Bienvenida al Sistema', 'system', '{"event": "user_registered"}', 'email', '<h1>👋 Bienvenida a GynSys</h1><p>Hola {patient_name}, gracias por registrarte en nuestro sistema de seguimiento ginecológico.</p>', true),
(3, 'Completar Perfil', 'system', '{"days_after_registration": 3, "profile_incomplete": true}', 'email', '<h1>📝 Completa tu Perfil</h1><p>Hola {patient_name}, completa tu perfil para aprovechar al máximo el sistema.</p>', true);
