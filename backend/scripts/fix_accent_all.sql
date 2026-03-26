-- Fix title accent for all doctor profiles
UPDATE doctor_profiles 
SET pdf_config = pdf_config || '{"report_title": "INFORME MÉDICO"}'::jsonb;
