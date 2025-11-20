-- Migration: Add text mode support for recording-v3 flow
-- Created: 2025-11-19
-- Purpose: Support text-only story entries as alternative to audio recording

-- Add text_body column for text-only stories
ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS text_body text;

-- Add recording_mode column to track how story was created
ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS recording_mode text
CHECK (recording_mode IN ('audio', 'text', 'photo_audio'));

-- Add default value for existing stories (assume audio mode)
UPDATE public.stories
SET recording_mode = 'audio'
WHERE recording_mode IS NULL;

-- Add index for filtering by recording mode
CREATE INDEX IF NOT EXISTS idx_stories_recording_mode
ON public.stories(recording_mode);

-- Update comments for new columns
COMMENT ON COLUMN public.stories.text_body IS 'Text content for text-only stories (alternative to audio recording). Null for audio-based stories.';
COMMENT ON COLUMN public.stories.recording_mode IS 'How the story was created: audio (audio only), text (typed entry), photo_audio (photo + audio flow)';

-- Add validation: story must have either audio_url OR text_body
-- Note: This is a CHECK constraint that allows NULL values for both during creation,
-- but application logic should ensure at least one is populated before final save
ALTER TABLE public.stories
ADD CONSTRAINT stories_content_check
CHECK (
  audio_url IS NOT NULL OR
  text_body IS NOT NULL OR
  -- Allow NULL during draft creation (will be populated before final save)
  created_at > NOW() - INTERVAL '5 minutes'
);
