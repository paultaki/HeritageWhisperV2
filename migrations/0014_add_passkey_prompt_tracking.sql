-- Migration: Add passkey prompt tracking to users table
-- Date: 2025-01-27
-- Purpose: Track login count and passkey prompt preferences to show prompts on 2nd+ login

-- Add new columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS passkey_prompt_dismissed TEXT,
  ADD COLUMN IF NOT EXISTS last_passkey_prompt_at TIMESTAMP;

-- Add comment for documentation
COMMENT ON COLUMN users.login_count IS 'Total number of successful logins for passkey prompt logic';
COMMENT ON COLUMN users.passkey_prompt_dismissed IS 'User preference for passkey prompts: null (show), later (remind), never (dont show)';
COMMENT ON COLUMN users.last_passkey_prompt_at IS 'Timestamp when passkey prompt was last shown to user';
