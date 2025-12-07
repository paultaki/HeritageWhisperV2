-- Add birth_date column to users table for full birthday (month, day, year)
-- This supplements birth_year for more precise birthday display

ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date date;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_birth_date ON users(birth_date);

-- Add a comment explaining the field
COMMENT ON COLUMN users.birth_date IS 'Full birth date (YYYY-MM-DD). Supplements birth_year for more precise display.';

-- Backfill existing users: set birth_date based on birth_year (defaulting to Jan 1)
UPDATE users
SET birth_date = make_date(birth_year, 1, 1)
WHERE birth_date IS NULL AND birth_year IS NOT NULL;
