BEGIN;
-- Set Mariel to user role so she appears in the SaaS tenant list
UPDATE doctors SET role = 'user' WHERE id = 1;

-- Delete redundant/duplicate tenants
DELETE FROM doctors WHERE id IN (3, 4);

COMMIT;
