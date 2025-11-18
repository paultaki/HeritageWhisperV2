-- Migration: Add queue and archive system for prompts redesign
-- Created: 2025-01-16
-- Description: Adds queue/dismiss functionality to unify AI and catalog prompt workflows

-- ============================================================================
-- 1. UPDATE active_prompts table (AI-generated personalized prompts)
-- ============================================================================

-- Add user_status column to track user actions on AI prompts
ALTER TABLE public.active_prompts
  ADD COLUMN IF NOT EXISTS user_status TEXT
  CHECK (user_status IN ('available', 'queued', 'dismissed'));

-- Add queue_position for ordering queued prompts
ALTER TABLE public.active_prompts
  ADD COLUMN IF NOT EXISTS queue_position INTEGER;

-- Add dismissed_at timestamp
ALTER TABLE public.active_prompts
  ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;

-- Add queued_at timestamp
ALTER TABLE public.active_prompts
  ADD COLUMN IF NOT EXISTS queued_at TIMESTAMPTZ;

-- Comment on new columns
COMMENT ON COLUMN public.active_prompts.user_status IS
  'User action status: NULL/available = in Prompts for X section, queued = in Queue section, dismissed = in Archive';
COMMENT ON COLUMN public.active_prompts.queue_position IS
  'Position in queue (lower number = higher priority)';
COMMENT ON COLUMN public.active_prompts.dismissed_at IS
  'Timestamp when user dismissed the prompt';
COMMENT ON COLUMN public.active_prompts.queued_at IS
  'Timestamp when user queued the prompt';

-- Create index for queued prompts
CREATE INDEX IF NOT EXISTS idx_active_prompts_queued
  ON public.active_prompts(user_id, user_status, queue_position)
  WHERE user_status = 'queued';

-- Create index for dismissed prompts
CREATE INDEX IF NOT EXISTS idx_active_prompts_dismissed
  ON public.active_prompts(user_id, user_status, dismissed_at DESC)
  WHERE user_status = 'dismissed';

-- ============================================================================
-- 2. UPDATE user_prompts table (catalog prompts from More Ideas)
-- ============================================================================

-- Update status constraint to include new statuses
ALTER TABLE public.user_prompts
  DROP CONSTRAINT IF EXISTS user_prompts_status_check;

ALTER TABLE public.user_prompts
  ADD CONSTRAINT user_prompts_status_check
  CHECK (status IN ('ready', 'queued', 'dismissed', 'recorded', 'deleted'));

-- Add queue_position for ordering
ALTER TABLE public.user_prompts
  ADD COLUMN IF NOT EXISTS queue_position INTEGER;

-- Add dismissed_at timestamp
ALTER TABLE public.user_prompts
  ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;

-- Add queued_at timestamp
ALTER TABLE public.user_prompts
  ADD COLUMN IF NOT EXISTS queued_at TIMESTAMPTZ;

-- Update existing 'ready' status to 'queued' (migration)
UPDATE public.user_prompts
  SET status = 'queued', queued_at = created_at
  WHERE status = 'ready';

-- Update existing 'saved' status to 'dismissed' (migration)
UPDATE public.user_prompts
  SET status = 'dismissed', dismissed_at = created_at
  WHERE status = 'saved';

-- Update unique index to work with new statuses
DROP INDEX IF EXISTS user_prompts_user_text_status_idx;

CREATE UNIQUE INDEX IF NOT EXISTS user_prompts_user_text_active_idx
  ON public.user_prompts (user_id, text, status)
  WHERE status IN ('queued', 'dismissed');

-- Update status index
DROP INDEX IF EXISTS idx_user_prompts_user_status;

CREATE INDEX IF NOT EXISTS idx_user_prompts_user_status
  ON public.user_prompts(user_id, status, queue_position, created_at DESC);

-- Create index for queued prompts
CREATE INDEX IF NOT EXISTS idx_user_prompts_queued
  ON public.user_prompts(user_id, status, queue_position)
  WHERE status = 'queued';

-- Create index for dismissed prompts
CREATE INDEX IF NOT EXISTS idx_user_prompts_dismissed
  ON public.user_prompts(user_id, status, dismissed_at DESC)
  WHERE status = 'dismissed';

-- Comment updates
COMMENT ON COLUMN public.user_prompts.status IS
  'queued: in Queue section, dismissed: in Archive section, recorded: user recorded story, deleted: permanently removed';

-- ============================================================================
-- 3. CREATE helper function to get next queue position
-- ============================================================================

CREATE OR REPLACE FUNCTION get_next_queue_position(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_pos_active INTEGER;
  max_pos_catalog INTEGER;
  result INTEGER;
BEGIN
  -- Get max position from active_prompts
  SELECT COALESCE(MAX(queue_position), 0)
  INTO max_pos_active
  FROM public.active_prompts
  WHERE user_id = p_user_id AND user_status = 'queued';

  -- Get max position from user_prompts
  SELECT COALESCE(MAX(queue_position), 0)
  INTO max_pos_catalog
  FROM public.user_prompts
  WHERE user_id = p_user_id AND status = 'queued';

  -- Return the greater of the two + 1
  result := GREATEST(max_pos_active, max_pos_catalog) + 1;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION get_next_queue_position IS
  'Returns the next available queue position for a user across both active_prompts and user_prompts tables';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_next_queue_position TO authenticated;

-- ============================================================================
-- 4. UPDATE prompt_history table to track dismissals
-- ============================================================================

-- Add dismissed outcome if not exists
-- (prompt_history.outcome is already flexible TEXT, just document it)
COMMENT ON COLUMN public.prompt_history.outcome IS
  'used: recorded story, skipped: saved for later (legacy), dismissed: moved to archive, expired: auto-expired';

-- ============================================================================
-- Summary
-- ============================================================================

-- This migration enables the new queue-based workflow:
--
-- QUEUE SECTION (top):
--   - active_prompts WHERE user_status = 'queued'
--   - user_prompts WHERE status = 'queued'
--   - Ordered by queue_position
--
-- PROMPTS FOR X SECTION (personalized):
--   - active_prompts WHERE user_status IS NULL OR user_status = 'available'
--   - Shows only AI-generated prompts that haven't been queued/dismissed
--
-- ARCHIVE SECTION (dismissed):
--   - active_prompts WHERE user_status = 'dismissed'
--   - user_prompts WHERE status = 'dismissed'
--   - Ordered by dismissed_at DESC
