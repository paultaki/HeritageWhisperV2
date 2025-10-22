-- Script to Clear and Regenerate Prompts for Test Account
-- Run this in Supabase SQL Editor
--
-- USAGE:
-- 1. Replace 'YOUR_TEST_USER_ID' with your actual test user ID
-- 2. Run this script in Supabase SQL editor
-- 3. Then trigger new prompt generation from your app (see instructions below)

-- ============================================
-- STEP 1: Set your test user ID
-- ============================================
DO $$
DECLARE
  test_user_id UUID := '38ad3036-e423-4e41-a3f3-020664a1ee0e'; -- REPLACE THIS!
  deleted_active INT;
  deleted_history INT;
  archived_count INT;
  story_count INT;
BEGIN
  -- Verify user exists and has stories
  SELECT COUNT(*) INTO story_count
  FROM public.stories
  WHERE user_id = test_user_id;

  IF story_count = 0 THEN
    RAISE EXCEPTION 'User % has no stories or does not exist', test_user_id;
  END IF;

  RAISE NOTICE 'Found user with % stories', story_count;

  -- ============================================
  -- STEP 2: Archive existing active prompts to history
  -- ============================================
  -- First, archive any active prompts that should be preserved
  WITH archived AS (
    INSERT INTO public.prompt_history (
      user_id,
      prompt_text,
      anchor_entity,
      anchor_year,
      anchor_hash,
      tier,
      memory_type,
      prompt_score,
      shown_count,
      outcome,
      resolved_at,
      created_at
    )
    SELECT
      user_id,
      prompt_text,
      anchor_entity,
      anchor_year,
      anchor_hash,
      tier,
      memory_type,
      prompt_score,
      shown_count,
      'expired', -- Mark as expired since we're force-clearing
      NOW(),
      created_at
    FROM public.active_prompts
    WHERE user_id = test_user_id
      AND tier = 3 -- Only archive Tier 3 prompts
    RETURNING id
  )
  SELECT COUNT(*) INTO archived_count FROM archived;

  RAISE NOTICE 'Archived % Tier 3 prompts to history', archived_count;

  -- ============================================
  -- STEP 3: Clear all active prompts for user
  -- ============================================
  DELETE FROM public.active_prompts
  WHERE user_id = test_user_id;

  GET DIAGNOSTICS deleted_active = ROW_COUNT;

  RAISE NOTICE 'Deleted % active prompts', deleted_active;

  -- ============================================
  -- STEP 4: Clear prompt history (optional)
  -- ============================================
  -- Uncomment if you want to also clear history
  -- This removes all record of previous prompts
  /*
  DELETE FROM public.prompt_history
  WHERE user_id = test_user_id
    AND tier = 3 -- Only delete Tier 3 history
  RETURNING id INTO deleted_history;

  GET DIAGNOSTICS deleted_history = ROW_COUNT;

  RAISE NOTICE 'Deleted % prompt history records', deleted_history;
  */

  -- ============================================
  -- STEP 5: Clear character evolution data
  -- ============================================
  -- This clears the character analysis stored from Tier 3
  DELETE FROM public.character_evolution
  WHERE user_id = test_user_id;

  RAISE NOTICE 'Cleared character evolution data for user';

  -- ============================================
  -- STEP 6: Show summary
  -- ============================================
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CLEANUP COMPLETE FOR USER %', test_user_id;
  RAISE NOTICE '  - Stories: %', story_count;
  RAISE NOTICE '  - Active prompts deleted: %', deleted_active;
  RAISE NOTICE '  - Prompts archived: %', archived_count;
  RAISE NOTICE '  - Character evolution: CLEARED';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Next step: Trigger new prompt generation';
  RAISE NOTICE 'Either: 1) Save a new story, or';
  RAISE NOTICE '        2) Use the force-regenerate endpoint';

END $$;

-- ============================================
-- VERIFICATION QUERIES (Run these separately)
-- ============================================

-- Check current active prompts for user
/*
SELECT
  id,
  prompt_text,
  tier,
  memory_type,
  created_at,
  expires_at
FROM public.active_prompts
WHERE user_id = 'YOUR_TEST_USER_ID'
ORDER BY created_at DESC;
*/

-- Check story count and milestone
/*
SELECT
  u.id,
  u.name,
  u.milestone_reached,
  COUNT(s.id) as story_count,
  u.character_insights IS NOT NULL as has_insights
FROM public.users u
LEFT JOIN public.stories s ON s.user_id = u.id
WHERE u.id = '6f604bbe-0fd8-4678-866f-c851be661e0a'
GROUP BY u.id, u.name, u.milestone_reached, u.character_insights;
*/

-- Check prompt history
/*
SELECT
  prompt_text,
  tier,
  outcome,
  resolved_at
FROM public.prompt_history
WHERE user_id = 'YOUR_TEST_USER_ID'
ORDER BY resolved_at DESC
LIMIT 10;
*/