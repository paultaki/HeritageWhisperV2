-- Fix user ID mismatch
-- First, check if user with email exists but different ID
SELECT * FROM users WHERE email = 'hello@heritagewhisper.com';

-- Update the existing user to have the correct ID from Supabase Auth
-- Replace the ID if it exists with wrong ID
UPDATE users
SET id = '38ad3036-e423-4e41-a3f3-020664a1ee0e'
WHERE email = 'hello@heritagewhisper.com'
AND id != '38ad3036-e423-4e41-a3f3-020664a1ee0e';

-- Or if you prefer to delete and recreate
-- DELETE FROM users WHERE email = 'hello@heritagewhisper.com';
-- INSERT INTO users (id, email, name, birth_year)
-- VALUES ('38ad3036-e423-4e41-a3f3-020664a1ee0e', 'hello@heritagewhisper.com', 'User', 1950);