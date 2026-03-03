BEGIN;
-- Set Mariel to user role so she appears in the SaaS tenant list
UPDATE doctors SET role = 'user' WHERE id = 1;

-- Delete related data for redundant tenants (3, 4)
DELETE FROM tenant_modules WHERE tenant_id IN (3, 4);
DELETE FROM doctor_certifications WHERE doctor_id IN (3, 4);
DELETE FROM appointments WHERE doctor_id IN (3, 4);
DELETE FROM blog_posts WHERE doctor_id IN (3, 4);
DELETE FROM consultations WHERE doctor_id IN (3, 4);
DELETE FROM cycle_logs WHERE doctor_id IN (3, 4);
DELETE FROM cycle_users WHERE doctor_id IN (3, 4);
DELETE FROM endometriosis_results WHERE doctor_id IN (3, 4);
DELETE FROM faqs WHERE doctor_id IN (3, 4);
DELETE FROM gallery_images WHERE doctor_id IN (3, 4);
DELETE FROM locations WHERE doctor_id IN (3, 4);
DELETE FROM preconsultation_questions WHERE doctor_id IN (3, 4);
DELETE FROM services WHERE doctor_id IN (3, 4);
DELETE FROM symptom_logs WHERE doctor_id IN (3, 4);
DELETE FROM testimonials WHERE doctor_id IN (3, 4);
DELETE FROM oauth_whitelist WHERE added_by IN (3, 4);

-- Delete redundant/duplicate tenants
DELETE FROM doctors WHERE id IN (3, 4);

COMMIT;
