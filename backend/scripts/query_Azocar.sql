SELECT preconsulta_answers FROM consultations WHERE patient_id = (SELECT id FROM patients WHERE ci = '22028080' LIMIT 1) LIMIT 1;
