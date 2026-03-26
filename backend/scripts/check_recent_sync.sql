-- Check for recent consultations
SELECT id, patient_name, patient_ci, created_at, admin_observations 
FROM consultations 
ORDER BY created_at DESC 
LIMIT 10;

-- Check for recent appointments
SELECT id, patient_name, patient_dni, appointment_type, created_at 
FROM appointments 
ORDER BY created_at DESC 
LIMIT 10;
