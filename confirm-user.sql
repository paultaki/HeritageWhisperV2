-- Correct SQL to confirm user in Supabase
-- The confirmed_at column is auto-generated, we only need to update email_confirmed_at

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'test@example.com';

-- Verify the user is confirmed
SELECT id, email, email_confirmed_at, confirmed_at, created_at
FROM auth.users
WHERE email = 'test@example.com';