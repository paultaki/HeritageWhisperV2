-- Migration: Add missing last_accessed_at column to family_members
-- Created: 2025-12-03
-- Description: The column was planned in 0007 but never added. Many code paths reference it.

ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN public.family_members.last_accessed_at IS 'When family member last accessed/viewed stories';
