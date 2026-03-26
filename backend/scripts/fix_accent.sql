UPDATE doctor_profiles SET pdf_config = pdf_config || '{"report_title": "INFORME MÉDICO"}'::jsonb WHERE id = 1;
