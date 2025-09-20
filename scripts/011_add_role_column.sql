-- Add role column to staff table
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'waiter';

-- Update existing staff members - you can manually set admin roles as needed
-- For now, any staff_id containing 'admin' gets admin role
UPDATE staff 
SET role = 'admin' 
WHERE staff_id ILIKE '%admin%' OR staff_id = '2009AD';

-- Make sure all other staff members have waiter role
UPDATE staff 
SET role = 'waiter' 
WHERE role IS NULL;

-- Add password column to store the generated ID as password
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- For existing users, set their password to be their staff_id (which will be their ID)
-- This will be hashed when they first log in or when admin updates it
UPDATE staff 
SET password_hash = staff_id 
WHERE password_hash IS NULL;