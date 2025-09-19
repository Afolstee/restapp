-- Create admin user in Supabase Auth and link to users table
-- This script should be run after the admin user is created in Supabase Auth

-- First, let's make sure we have a users record for the admin
-- Replace 'YOUR_AUTH_USER_ID' with the actual UUID from Supabase Auth
INSERT INTO users (id, username, email, first_name, last_name, role, is_active, created_at, updated_at)
VALUES (
  'admin-user-id-placeholder', -- This will need to be updated with actual auth user ID
  'Restwebbapp',
  'admin@restaurant.com',
  'Restaurant',
  'Admin',
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Also ensure we can find by email
INSERT INTO users (id, username, email, first_name, last_name, role, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Restwebbapp',
  'admin@restaurant.com',
  'Restaurant',
  'Admin',
  'admin',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@restaurant.com'
);
