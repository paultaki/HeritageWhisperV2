-- Add missing visibility columns to stories table
-- Safe to run on existing database

-- Add include_in_book column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' AND column_name = 'include_in_book'
  ) THEN
    ALTER TABLE stories ADD COLUMN include_in_book BOOLEAN DEFAULT true NOT NULL;
  END IF;
END $$;

-- Add include_in_timeline column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' AND column_name = 'include_in_timeline'
  ) THEN
    ALTER TABLE stories ADD COLUMN include_in_timeline BOOLEAN DEFAULT true NOT NULL;
  END IF;
END $$;

-- Add is_favorite column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' AND column_name = 'is_favorite'
  ) THEN
    ALTER TABLE stories ADD COLUMN is_favorite BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;
