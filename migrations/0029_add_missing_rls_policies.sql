-- Migration: Add Missing RLS Policies
-- Created: 2025-11-29
-- Description: Enable RLS on tables that were missing it

-- ============================================================================
-- ACTIVE_PROMPTS
-- ============================================================================

ALTER TABLE public.active_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own active_prompts" ON public.active_prompts;
DROP POLICY IF EXISTS "Users can insert their own active_prompts" ON public.active_prompts;
DROP POLICY IF EXISTS "Users can update their own active_prompts" ON public.active_prompts;
DROP POLICY IF EXISTS "Users can delete their own active_prompts" ON public.active_prompts;
DROP POLICY IF EXISTS "Service role has full access to active_prompts" ON public.active_prompts;

CREATE POLICY "Users can view their own active_prompts"
  ON public.active_prompts FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own active_prompts"
  ON public.active_prompts FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own active_prompts"
  ON public.active_prompts FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own active_prompts"
  ON public.active_prompts FOR DELETE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role has full access to active_prompts"
  ON public.active_prompts FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- PROMPT_HISTORY
-- ============================================================================

ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own prompt_history" ON public.prompt_history;
DROP POLICY IF EXISTS "Users can insert their own prompt_history" ON public.prompt_history;
DROP POLICY IF EXISTS "Users can update their own prompt_history" ON public.prompt_history;
DROP POLICY IF EXISTS "Users can delete their own prompt_history" ON public.prompt_history;
DROP POLICY IF EXISTS "Service role has full access to prompt_history" ON public.prompt_history;

CREATE POLICY "Users can view their own prompt_history"
  ON public.prompt_history FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own prompt_history"
  ON public.prompt_history FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own prompt_history"
  ON public.prompt_history FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own prompt_history"
  ON public.prompt_history FOR DELETE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role has full access to prompt_history"
  ON public.prompt_history FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- PROFILES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role has full access to profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role has full access to profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- HISTORICAL_CONTEXT
-- ============================================================================

ALTER TABLE public.historical_context ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own historical_context" ON public.historical_context;
DROP POLICY IF EXISTS "Users can insert their own historical_context" ON public.historical_context;
DROP POLICY IF EXISTS "Users can update their own historical_context" ON public.historical_context;
DROP POLICY IF EXISTS "Users can delete their own historical_context" ON public.historical_context;
DROP POLICY IF EXISTS "Service role has full access to historical_context" ON public.historical_context;

CREATE POLICY "Users can view their own historical_context"
  ON public.historical_context FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own historical_context"
  ON public.historical_context FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own historical_context"
  ON public.historical_context FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own historical_context"
  ON public.historical_context FOR DELETE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role has full access to historical_context"
  ON public.historical_context FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- FAMILY_ACTIVITY
-- ============================================================================

ALTER TABLE public.family_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own family_activity" ON public.family_activity;
DROP POLICY IF EXISTS "Users can insert their own family_activity" ON public.family_activity;
DROP POLICY IF EXISTS "Users can update their own family_activity" ON public.family_activity;
DROP POLICY IF EXISTS "Users can delete their own family_activity" ON public.family_activity;
DROP POLICY IF EXISTS "Service role has full access to family_activity" ON public.family_activity;

CREATE POLICY "Users can view their own family_activity"
  ON public.family_activity FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own family_activity"
  ON public.family_activity FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own family_activity"
  ON public.family_activity FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own family_activity"
  ON public.family_activity FOR DELETE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role has full access to family_activity"
  ON public.family_activity FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- SHARED_ACCESS
-- ============================================================================

ALTER TABLE public.shared_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view shared_access they own or are shared with" ON public.shared_access;
DROP POLICY IF EXISTS "Users can insert their own shared_access" ON public.shared_access;
DROP POLICY IF EXISTS "Users can update their own shared_access" ON public.shared_access;
DROP POLICY IF EXISTS "Users can delete their own shared_access" ON public.shared_access;
DROP POLICY IF EXISTS "Service role has full access to shared_access" ON public.shared_access;

CREATE POLICY "Users can view shared_access they own or are shared with"
  ON public.shared_access FOR SELECT
  USING (
    owner_user_id = (SELECT auth.uid()) OR
    shared_with_user_id = (SELECT auth.uid())
  );

CREATE POLICY "Users can insert their own shared_access"
  ON public.shared_access FOR INSERT
  WITH CHECK (owner_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own shared_access"
  ON public.shared_access FOR UPDATE
  USING (owner_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own shared_access"
  ON public.shared_access FOR DELETE
  USING (owner_user_id = (SELECT auth.uid()));

CREATE POLICY "Service role has full access to shared_access"
  ON public.shared_access FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- USER_AGREEMENTS
-- ============================================================================

ALTER TABLE public.user_agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own user_agreements" ON public.user_agreements;
DROP POLICY IF EXISTS "Users can insert their own user_agreements" ON public.user_agreements;
DROP POLICY IF EXISTS "Service role has full access to user_agreements" ON public.user_agreements;

CREATE POLICY "Users can view their own user_agreements"
  ON public.user_agreements FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own user_agreements"
  ON public.user_agreements FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role has full access to user_agreements"
  ON public.user_agreements FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- GHOST_PROMPTS
-- ============================================================================

ALTER TABLE public.ghost_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own ghost_prompts" ON public.ghost_prompts;
DROP POLICY IF EXISTS "Users can insert their own ghost_prompts" ON public.ghost_prompts;
DROP POLICY IF EXISTS "Users can update their own ghost_prompts" ON public.ghost_prompts;
DROP POLICY IF EXISTS "Users can delete their own ghost_prompts" ON public.ghost_prompts;
DROP POLICY IF EXISTS "Service role has full access to ghost_prompts" ON public.ghost_prompts;

CREATE POLICY "Users can view their own ghost_prompts"
  ON public.ghost_prompts FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own ghost_prompts"
  ON public.ghost_prompts FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own ghost_prompts"
  ON public.ghost_prompts FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own ghost_prompts"
  ON public.ghost_prompts FOR DELETE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role has full access to ghost_prompts"
  ON public.ghost_prompts FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- FOLLOW_UPS (no user_id column - uses story_id relationship)
-- ============================================================================

ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view follow_ups for their stories" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can insert follow_ups for their stories" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can update follow_ups for their stories" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can delete follow_ups for their stories" ON public.follow_ups;
DROP POLICY IF EXISTS "Service role has full access to follow_ups" ON public.follow_ups;

CREATE POLICY "Users can view follow_ups for their stories"
  ON public.follow_ups FOR SELECT
  USING (
    story_id IN (
      SELECT id FROM public.stories WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert follow_ups for their stories"
  ON public.follow_ups FOR INSERT
  WITH CHECK (
    story_id IN (
      SELECT id FROM public.stories WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update follow_ups for their stories"
  ON public.follow_ups FOR UPDATE
  USING (
    story_id IN (
      SELECT id FROM public.stories WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete follow_ups for their stories"
  ON public.follow_ups FOR DELETE
  USING (
    story_id IN (
      SELECT id FROM public.stories WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Service role has full access to follow_ups"
  ON public.follow_ups FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- DEMO_STORIES (public demo data - read-only for all, owner can modify)
-- ============================================================================

ALTER TABLE public.demo_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view demo_stories" ON public.demo_stories;
DROP POLICY IF EXISTS "Service role has full access to demo_stories" ON public.demo_stories;

CREATE POLICY "Anyone can view demo_stories"
  ON public.demo_stories FOR SELECT
  USING (true);

CREATE POLICY "Service role has full access to demo_stories"
  ON public.demo_stories FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  tables_with_rls INTEGER;
BEGIN
  SELECT COUNT(*) INTO tables_with_rls
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = true;

  RAISE NOTICE 'Tables with RLS enabled: %', tables_with_rls;
END $$;
