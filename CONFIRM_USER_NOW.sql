-- SOLUTION 1: Update the test user to be confirmed
-- Run this in Supabase SQL Editor

UPDATE auth.users
SET
  email_confirmed_at = NOW(),
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"email_verified": true}'::jsonb
WHERE email = 'test@example.com'
RETURNING id, email, email_confirmed_at;

-- This should return 1 row with the email_confirmed_at set to current time

-- ============================================
-- SOLUTION 2: If the above doesn't work, delete and recreate
-- ============================================

-- First delete the old user
-- DELETE FROM auth.users WHERE email = 'test@example.com';

-- Then create a new test user that's pre-confirmed
-- You'll need to register again after deleting

-- ============================================
-- SOLUTION 3: Create a trigger for auto-confirmation
-- This will auto-confirm ALL new users
-- ============================================

-- Create function to auto-confirm
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- After creating this trigger, register a new user with email: test2@example.com
-- They will be auto-confirmed and can log in immediately

-- ============================================
-- VERIFY: Check if user is confirmed
-- ============================================
SELECT
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  CASE
    WHEN email_confirmed_at IS NOT NULL THEN 'CONFIRMED ✅'
    ELSE 'NOT CONFIRMED ❌'
  END as status
FROM auth.users
WHERE email IN ('test@example.com', 'test2@example.com')
ORDER BY created_at DESC;