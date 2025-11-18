-- Migration: Add Contributor Permissions & Family Prompts
-- Created: 2025-01-XX
-- Description: Add permission levels to family members and family prompts table

-- ============================================================================
-- PART 1: ADD PERMISSION LEVEL TO FAMILY MEMBERS
-- ============================================================================

-- Add permission_level column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'family_members' 
        AND column_name = 'permission_level'
    ) THEN
        ALTER TABLE public.family_members 
        ADD COLUMN permission_level TEXT DEFAULT 'viewer' 
        CHECK (permission_level IN ('viewer', 'contributor'));
        
        COMMENT ON COLUMN public.family_members.permission_level IS 'viewer: read-only access, contributor: can add prompts and stories';
    END IF;
END $$;

-- ============================================================================
-- PART 2: CREATE FAMILY PROMPTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.family_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storyteller_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  submitted_by_family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  context TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'skipped', 'archived')),
  answered_story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 3: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_family_prompts_storyteller 
  ON public.family_prompts(storyteller_user_id, status);

CREATE INDEX IF NOT EXISTS idx_family_prompts_submitted_by 
  ON public.family_prompts(submitted_by_family_member_id);

CREATE INDEX IF NOT EXISTS idx_family_prompts_status 
  ON public.family_prompts(status) WHERE status = 'pending';

-- ============================================================================
-- PART 4: ENABLE RLS
-- ============================================================================

ALTER TABLE public.family_prompts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 5: CREATE RLS POLICIES
-- ============================================================================

-- Storytellers can view prompts submitted to them
DROP POLICY IF EXISTS "Storytellers can view their family prompts" ON public.family_prompts;
CREATE POLICY "Storytellers can view their family prompts"
  ON public.family_prompts
  FOR SELECT
  USING (auth.uid() = storyteller_user_id);

-- Storytellers can update status of their prompts
DROP POLICY IF EXISTS "Storytellers can update their family prompts" ON public.family_prompts;
CREATE POLICY "Storytellers can update their family prompts"
  ON public.family_prompts
  FOR UPDATE
  USING (auth.uid() = storyteller_user_id);

-- Service role has full access (for family members to submit via API)
DROP POLICY IF EXISTS "Service role can manage family prompts" ON public.family_prompts;
CREATE POLICY "Service role can manage family prompts"
  ON public.family_prompts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PART 6: ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE public.family_prompts IS 'Questions submitted by family members for the storyteller to answer';
COMMENT ON COLUMN public.family_prompts.storyteller_user_id IS 'The user who will answer this prompt';
COMMENT ON COLUMN public.family_prompts.submitted_by_family_member_id IS 'The family member who submitted this question';
COMMENT ON COLUMN public.family_prompts.prompt_text IS 'The question or prompt text';
COMMENT ON COLUMN public.family_prompts.context IS 'Optional context about why they want to know';
COMMENT ON COLUMN public.family_prompts.status IS 'pending: not answered, answered: story created, skipped: user declined, archived: removed from view';
COMMENT ON COLUMN public.family_prompts.answered_story_id IS 'The story that answered this prompt (if answered)';

-- ============================================================================
-- PART 7: CREATE UPDATE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_family_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_family_prompts_updated_at ON public.family_prompts;
CREATE TRIGGER trigger_update_family_prompts_updated_at
  BEFORE UPDATE ON public.family_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_family_prompts_updated_at();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
