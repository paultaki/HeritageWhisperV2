-- Migration: Add Profile Interests
-- Purpose: Store user interests (general, people, places) for personalized prompt generation
-- Date: 2025-10-24

-- Add profile_interests column to users table
-- JSONB format: { general: string | null, people: string | null, places: string | null }
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_interests JSONB;

-- Add comment for documentation
COMMENT ON COLUMN users.profile_interests IS
'User interests for personalized prompt generation. Structure: { general, people, places }. Used to create more relevant and personal reflection questions.';
