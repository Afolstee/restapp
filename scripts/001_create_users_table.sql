-- Create users table for staff management
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('waiter', 'admin')),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  hire_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "users_select_own" ON public.users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users 
  FOR UPDATE USING (auth.uid() = id);

-- Admin can view all users
CREATE POLICY "admin_select_all_users" ON public.users 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can insert new users
CREATE POLICY "admin_insert_users" ON public.users 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update all users
CREATE POLICY "admin_update_users" ON public.users 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default admin user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@restaurant.com',
  crypt('0919RW', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Get the admin user ID and insert into public.users
DO $$
DECLARE
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@restaurant.com';
    
    INSERT INTO public.users (id, username, password_hash, role, first_name, last_name, email)
    VALUES (
        admin_id,
        'Restwebbapp',
        crypt('0919RW', gen_salt('bf')),
        'admin',
        'Restaurant',
        'Admin',
        'admin@restaurant.com'
    ) ON CONFLICT (id) DO NOTHING;
END $$;
