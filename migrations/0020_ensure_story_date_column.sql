-- Migration: Ensure story_date column exists in stories table
-- Description: Add story_date column if it doesn't exist (for storing full date with month/day)
-- Date: 2025-10-29

-- Add story_date column to stories table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'stories'
    AND column_name = 'story_date'
  ) THEN
    ALTER TABLE stories ADD COLUMN story_date TIMESTAMP;
    RAISE NOTICE 'Added story_date column to stories table';
  ELSE
    RAISE NOTICE 'story_date column already exists in stories table';
  END IF;
END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'stories'
    AND column_name = 'story_date'
  ) THEN
    RAISE NOTICE 'Verification successful: story_date column exists';
  ELSE
    RAISE EXCEPTION 'Verification failed: story_date column does not exist';
  END IF;
END $$;
