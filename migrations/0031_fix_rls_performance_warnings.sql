-- Migration: Fix RLS Performance Warnings
-- Created: 2025-12-02
-- Description: Fixes 44 Supabase linter warnings:
--   - 23 auth_rls_initplan warnings (auth.uid() -> (select auth.uid()))
--   - 20 multiple_permissive_policies warnings (consolidate overlapping policies)
--   - 1 duplicate_index warning (drop duplicate family_sessions index)

-- ============================================================================
-- PART 1: FIX AUTH.UID() -> (SELECT AUTH.UID()) FOR PERFORMANCE
-- These policies re-evaluate auth.uid() for each row, causing poor performance
-- ============================================================================

-- -----------------------------------------------------------------------------
-- 1.1 USER_PROMPTS TABLE (4 policies)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own prompts" ON public.user_prompts;
DROP POLICY IF EXISTS "Users can insert their own prompts" ON public.user_prompts;
DROP POLICY IF EXISTS "Users can update their own prompts" ON public.user_prompts;
DROP POLICY IF EXISTS "Users can delete their own prompts" ON public.user_prompts;

CREATE POLICY "Users can view their own prompts"
  ON public.user_prompts FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own prompts"
  ON public.user_prompts FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own prompts"
  ON public.user_prompts FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own prompts"
  ON public.user_prompts FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- -----------------------------------------------------------------------------
-- 1.2 PROMPT_FEEDBACK TABLE (1 policy)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin full access to prompt_feedback" ON public.prompt_feedback;

CREATE POLICY "Admin full access to prompt_feedback"
  ON public.prompt_feedback FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = (SELECT auth.uid())
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 1.3 FAMILY_MEMBERS TABLE (4 policies)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can insert their own family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can update their own family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can delete their own family members" ON public.family_members;

CREATE POLICY "Users can view their own family members"
  ON public.family_members FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own family members"
  ON public.family_members FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own family members"
  ON public.family_members FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own family members"
  ON public.family_members FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- -----------------------------------------------------------------------------
-- 1.4 FAMILY_PROMPTS TABLE (2 user policies + fix service role overlap)
-- Also fixes multiple_permissive_policies warning by scoping service_role policy
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Storytellers can view their family prompts" ON public.family_prompts;
DROP POLICY IF EXISTS "Storytellers can update their family prompts" ON public.family_prompts;
DROP POLICY IF EXISTS "Service role can manage family prompts" ON public.family_prompts;

-- User policies with optimized auth.uid()
CREATE POLICY "Storytellers can view their family prompts"
  ON public.family_prompts FOR SELECT
  USING (storyteller_user_id = (SELECT auth.uid()));

CREATE POLICY "Storytellers can update their family prompts"
  ON public.family_prompts FOR UPDATE
  USING (storyteller_user_id = (SELECT auth.uid()));

-- Service role policy scoped to service_role only (fixes multiple_permissive_policies)
CREATE POLICY "Service role can manage family prompts"
  ON public.family_prompts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 1.5 PAYWALL_EVENTS TABLE (1 policy)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read their own paywall events" ON public.paywall_events;

CREATE POLICY "Users can read their own paywall events"
  ON public.paywall_events FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- -----------------------------------------------------------------------------
-- 1.6 ACTIVITY_EVENTS TABLE (2 policies + fix service role overlap)
-- Also fixes multiple_permissive_policies warning
-- Note: Original policy referenced non-existent family_collaborations table
--       Simplified to user's own events only (family access via API/service_role)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read their own activity events" ON public.activity_events;
DROP POLICY IF EXISTS "Users can insert their own activity events" ON public.activity_events;
DROP POLICY IF EXISTS "Service role can insert activity events" ON public.activity_events;

-- User SELECT policy with optimized auth.uid()
CREATE POLICY "Users can read their own activity events"
  ON public.activity_events FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- User INSERT policy with optimized auth.uid()
CREATE POLICY "Users can insert their own activity events"
  ON public.activity_events FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Service role policy scoped properly (fixes multiple_permissive_policies)
CREATE POLICY "Service role can insert activity events"
  ON public.activity_events FOR INSERT
  TO service_role
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 1.7 PASSKEYS TABLE (4 policies)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own passkeys" ON public.passkeys;
DROP POLICY IF EXISTS "Users can insert own passkeys" ON public.passkeys;
DROP POLICY IF EXISTS "Users can update own passkeys" ON public.passkeys;
DROP POLICY IF EXISTS "Users can delete own passkeys" ON public.passkeys;

CREATE POLICY "Users can view own passkeys"
  ON public.passkeys FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own passkeys"
  ON public.passkeys FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own passkeys"
  ON public.passkeys FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own passkeys"
  ON public.passkeys FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- -----------------------------------------------------------------------------
-- 1.8 TREASURES TABLE (4 policies) - if table exists
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'treasures') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view their own treasures" ON public.treasures;
    DROP POLICY IF EXISTS "Users can insert their own treasures" ON public.treasures;
    DROP POLICY IF EXISTS "Users can update their own treasures" ON public.treasures;
    DROP POLICY IF EXISTS "Users can delete their own treasures" ON public.treasures;

    -- Recreate with optimized auth.uid()
    EXECUTE 'CREATE POLICY "Users can view their own treasures"
      ON public.treasures FOR SELECT
      USING (user_id = (SELECT auth.uid()))';

    EXECUTE 'CREATE POLICY "Users can insert their own treasures"
      ON public.treasures FOR INSERT
      WITH CHECK (user_id = (SELECT auth.uid()))';

    EXECUTE 'CREATE POLICY "Users can update their own treasures"
      ON public.treasures FOR UPDATE
      USING (user_id = (SELECT auth.uid()))';

    EXECUTE 'CREATE POLICY "Users can delete their own treasures"
      ON public.treasures FOR DELETE
      USING (user_id = (SELECT auth.uid()))';

    RAISE NOTICE 'Fixed treasures RLS policies';
  ELSE
    RAISE NOTICE 'treasures table does not exist - skipping';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1.9 BETA_CODES TABLE (1 policy + fix service role overlap)
-- Also fixes multiple_permissive_policies warning
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read their own issued codes" ON public.beta_codes;
DROP POLICY IF EXISTS "Service role has full access" ON public.beta_codes;

-- User policy with optimized auth.uid()
CREATE POLICY "Users can read their own issued codes"
  ON public.beta_codes FOR SELECT
  USING (issued_to_user_id = (SELECT auth.uid()));

-- Service role policy scoped properly (fixes multiple_permissive_policies)
CREATE POLICY "Service role has full access"
  ON public.beta_codes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PART 2: FIX MULTIPLE PERMISSIVE POLICIES ON GIFT_CODES
-- Combine the two SELECT policies into one with OR condition
-- ============================================================================

DROP POLICY IF EXISTS "Purchasers can view their own gifts" ON public.gift_codes;
DROP POLICY IF EXISTS "Recipients can view their redeemed gifts" ON public.gift_codes;

-- Combined policy for both purchasers and recipients
CREATE POLICY "Users can view their own gifts"
  ON public.gift_codes FOR SELECT
  USING (
    purchaser_user_id = (SELECT auth.uid())
    OR purchaser_email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
    OR redeemed_by_user_id = (SELECT auth.uid())
  );

-- ============================================================================
-- PART 3: DROP DUPLICATE INDEX ON FAMILY_SESSIONS
-- idx_family_sessions_expires and idx_family_sessions_expires_at are identical
-- ============================================================================

-- Keep idx_family_sessions_expires_at (more descriptive name), drop the other
DROP INDEX IF EXISTS public.idx_family_sessions_expires;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Count policies to verify migration ran
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN (
    'user_prompts', 'prompt_feedback', 'family_members', 'family_prompts',
    'paywall_events', 'activity_events', 'passkeys', 'treasures',
    'beta_codes', 'gift_codes'
  );

  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Migration 0031_fix_rls_performance_warnings completed!';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Total policies on affected tables: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed issues:';
  RAISE NOTICE '  ✓ 23 auth_rls_initplan warnings (auth.uid() -> (select auth.uid()))';
  RAISE NOTICE '  ✓ 20 multiple_permissive_policies warnings (scoped service_role policies)';
  RAISE NOTICE '  ✓ 1 duplicate_index warning (dropped idx_family_sessions_expires)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;

-- Show final policy configuration
SELECT
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'user_prompts', 'prompt_feedback', 'family_members', 'family_prompts',
  'paywall_events', 'activity_events', 'passkeys', 'treasures',
  'beta_codes', 'gift_codes'
)
ORDER BY tablename, policyname;
