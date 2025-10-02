-- ============================================
-- FIX STORIES TABLE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Add missing columns to stories table
ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS include_in_timeline BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS has_photos BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS formatted_content TEXT,
ADD COLUMN IF NOT EXISTS wisdom_transcription TEXT,
ADD COLUMN IF NOT EXISTS follow_up_questions JSONB;

-- If you get errors about columns already existing, that's fine
-- The IF NOT EXISTS will handle it

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'stories'
ORDER BY ordinal_position;