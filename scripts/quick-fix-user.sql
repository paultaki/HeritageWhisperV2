-- Quick fix: Insert the user with correct ID if not exists
INSERT INTO users (id, email, name, birth_year)
VALUES ('38ad3036-e423-4e41-a3f3-020664a1ee0e', 'hello+supabase@heritagewhisper.com', 'User', 1950)
ON CONFLICT (id) DO NOTHING;

-- Or if you want to handle the email conflict:
-- First delete the old user (if no stories):
-- DELETE FROM users WHERE email = 'hello@heritagewhisper.com' AND id != '38ad3036-e423-4e41-a3f3-020664a1ee0e';

-- Then insert with correct ID:
-- INSERT INTO users (id, email, name, birth_year)
-- VALUES ('38ad3036-e423-4e41-a3f3-020664a1ee0e', 'hello@heritagewhisper.com', 'User', 1950)
-- ON CONFLICT (id) DO NOTHING;