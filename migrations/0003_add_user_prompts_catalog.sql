-- Migration: Add user_prompts table for catalog prompt management
-- Created: 2025-01-XX
-- Description: Adds table for managing catalog prompts that users manually add to their queue

-- Create user_prompts table
CREATE TABLE IF NOT EXISTS public.user_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  category TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'catalog' CHECK (source IN ('catalog', 'ai')),
  status TEXT NOT NULL CHECK (status IN ('ready', 'saved', 'recorded', 'deleted')) DEFAULT 'saved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate rows by text per user in active sets
CREATE UNIQUE INDEX IF NOT EXISTS user_prompts_user_text_status_idx
  ON public.user_prompts (user_id, text, status)
  WHERE status IN ('ready', 'saved');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_prompts_user_status 
  ON public.user_prompts(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_prompts_category 
  ON public.user_prompts(category);

-- Enable RLS
ALTER TABLE public.user_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own prompts"
  ON public.user_prompts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompts"
  ON public.user_prompts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts"
  ON public.user_prompts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts"
  ON public.user_prompts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE public.user_prompts IS 'Catalog prompts that users manually add to their queue';
COMMENT ON COLUMN public.user_prompts.status IS 'ready: in Ready to Tell hero list, saved: in Saved for later, recorded: user recorded story, deleted: removed';
COMMENT ON COLUMN public.user_prompts.source IS 'catalog: from browse catalog, ai: AI-generated personalized prompt';
