-- ============================================
-- COMPLETE SOLUTION: Delete old user and start fresh
-- Run these queries in order in Supabase SQL Editor
-- ============================================

-- STEP 1: Delete the problematic test user
DELETE FROM auth.users WHERE email = 'test@example.com';

-- STEP 2: Create auto-confirm trigger for ALL new users
-- This will automatically confirm any new user registration
CREATE OR REPLACE FUNCTION public.auto_confirm_all_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Immediately confirm the email for new users
  UPDATE auth.users
  SET
    email_confirmed_at = NOW(),
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"email_verified": true}'::jsonb
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop any existing trigger
DROP TRIGGER IF EXISTS auto_confirm_email ON auth.users;

-- Create the trigger
CREATE TRIGGER auto_confirm_email
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_all_users();

-- STEP 3: Verify the trigger was created
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND trigger_name = 'auto_confirm_email';

-- You should see the trigger listed

-- STEP 4: After running these queries, register a NEW user
-- Email: newtest@example.com
-- Password: TestPassword2024!
-- This user will be auto-confirmed and able to login immediately