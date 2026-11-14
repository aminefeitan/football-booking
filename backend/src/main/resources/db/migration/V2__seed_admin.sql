-- ============================================================================
-- V2__seed_admin.sql
-- Seed default admin user: admin@footbook.ma / footbook123
-- Uses BCrypt cost 12 hash (compatible with at.favre.lib.crypto.bcrypt)
-- ============================================================================

-- Insert admin into users table (base entity, JOINED inheritance)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, status, created_at, updated_at)
SELECT
    uuid_generate_v4(),
    'admin@footbook.ma',
    '$2a$12$t7KCdppJ2mXz116YR9dC5.mj/2mM6ZMIFct4e23x7Y6dLCAeDZdoa',
    'Admin',
    'FootBook',
    NULL,
    'ADMIN',
    'ACTIVE',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@footbook.ma');

-- Insert into admins table (child table for JOINED inheritance)
INSERT INTO admins (id, department)
SELECT u.id, 'Direction Générale'
FROM users u
WHERE u.email = 'admin@footbook.ma'
  AND NOT EXISTS (SELECT 1 FROM admins WHERE id = u.id);

