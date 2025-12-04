-- Migration: Add seen_at column to family_prompts for notification tracking
-- Purpose: Track when the storyteller has seen a family question to power notification badges

-- Add the seen_at column
ALTER TABLE public.family_prompts
  ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ;

-- Add an index for efficient querying of unseen questions
CREATE INDEX IF NOT EXISTS idx_family_prompts_unseen
  ON public.family_prompts (storyteller_user_id, seen_at)
  WHERE seen_at IS NULL;

-- Comment for documentation
COMMENT ON COLUMN public.family_prompts.seen_at IS
  'Timestamp when the storyteller first viewed this family question. NULL means unseen (shows notification badge).';
