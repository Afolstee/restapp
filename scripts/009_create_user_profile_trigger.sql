-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into users table when a new auth user is created
  INSERT INTO public.users (
    id,
    email,
    username,
    first_name,
    last_name,
    role,
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'username', 'user'),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Admin'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'staff'),
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
