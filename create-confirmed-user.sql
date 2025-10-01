-- Option 1: Update the existing test@example.com user
-- This should definitely work if executed properly
UPDATE auth.users
SET email_confirmed_at = CURRENT_TIMESTAMP
WHERE email = 'test@example.com';

-- Verify it worked
SELECT email, email_confirmed_at, confirmed_at
FROM auth.users
WHERE email = 'test@example.com';

-- Option 2: If Option 1 doesn't work, try updating by ID
UPDATE auth.users
SET email_confirmed_at = CURRENT_TIMESTAMP
WHERE id = '7979c17d-3d7c-47af-9cdd-a0bbfc2bf378';

-- Option 3: Create a completely new pre-confirmed user
-- This is a more complex approach but might work if the above fails
-- First, delete the old user if needed (optional)
-- DELETE FROM auth.users WHERE email = 'test@example.com';

-- Then you could manually insert a confirmed user, but this is complex
-- Better to use the UPDATE approach above