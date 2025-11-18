-- Migration: Add AI Processing Enabled Flag
-- Purpose: Allow users to opt-out of AI processing (transcription, prompts, analysis)
-- Date: 2025-10-17

-- Add ai_processing_enabled column to users table
-- Default to TRUE for existing users (grandfather them in)
-- New users will also default to TRUE (opt-in by default)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS ai_processing_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Add index for performance (we'll query this often)
CREATE INDEX IF NOT EXISTS idx_users_ai_processing_enabled
ON users(ai_processing_enabled);

-- Add comment for documentation
COMMENT ON COLUMN users.ai_processing_enabled IS
'Whether user has consented to AI processing of their stories. When FALSE: no transcription, no AI prompts, no AI analysis. Users can still type stories manually.';
