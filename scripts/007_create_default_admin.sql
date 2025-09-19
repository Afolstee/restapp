-- Create default admin user for testing
-- This creates the user in Supabase Auth and links it to our users table

-- First, we need to create the auth user (this would typically be done through Supabase dashboard)
-- For now, we'll create a placeholder entry that can be updated with the actual auth user ID

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  email_change_token_new,
  recovery_token,
  email_change_token_current,
  phone_change_token,
  phone_confirmed_at,
  phone_change_confirmed_at,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@restaurant.com',
  crypt('0919RW', gen_salt('bf')), -- Hash the password
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  '',
  null,
  null,
  0,
  null,
  '',
  null,
  false,
  null
) ON CONFLICT (email) DO NOTHING;

-- Get the auth user ID and create corresponding user record
DO $$
DECLARE
    auth_user_id uuid;
BEGIN
    SELECT id INTO auth_user_id FROM auth.users WHERE email = 'admin@restaurant.com';
    
    INSERT INTO public.users (
        id,
        username,
        email,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        auth_user_id,
        'admin',
        'admin@restaurant.com',
        'System',
        'Administrator',
        'admin',
        true,
        now(),
        now()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        updated_at = now();
END $$;
