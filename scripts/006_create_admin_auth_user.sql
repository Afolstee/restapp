-- Create admin user in Supabase Auth
-- This needs to be run to create the admin user properly in Supabase Auth system

-- First, we need to insert into auth.users (this is typically done via Supabase Auth API)
-- Since we can't directly insert into auth.users via SQL, we'll create a different approach

-- Update the users table to include the admin user with a proper email
UPDATE users 
SET email = 'admin@restaurant.com'
WHERE username = 'Restwebbapp';

-- Note: After running this script, you'll need to:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to Authentication > Users
-- 3. Click "Add user" 
-- 4. Create user with:
--    - Email: admin@restaurant.com
--    - Password: 0919RW
--    - Confirm password: 0919RW
-- 5. Copy the user ID from the created auth user
-- 6. Update the users table to link the auth user with the profile:

-- UPDATE users 
-- SET id = 'AUTH_USER_ID_FROM_SUPABASE_DASHBOARD'
-- WHERE username = 'Restwebbapp';
