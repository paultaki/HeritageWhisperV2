-- ============================================================================
-- Security Fix: Set search_path on functions
-- ============================================================================
-- This migration fixes the "function_search_path_mutable" security warning
-- by explicitly setting search_path = '' on all affected functions.
-- This prevents search_path manipulation attacks.
--
-- Affected functions:
--   - clean_test_prompts
--   - get_test_account_info
--   - set_user_story_milestone
--   - clone_user_account
-- ============================================================================

-- 1. Fix clone_user_account
CREATE OR REPLACE FUNCTION public.clone_user_account(
  source_user_id UUID,
  new_email TEXT,
  new_name TEXT DEFAULT NULL
)
RETURNS TABLE(
  new_user_id UUID,
  stories_cloned INT,
  photos_cloned INT
)
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_new_user_id UUID;
  v_stories_cloned INT := 0;
  v_photos_cloned INT := 0;
  v_photos_this_story INT := 0;
  v_story_mapping JSONB := '{}';
  v_old_story_id UUID;
  v_new_story_id UUID;
  v_new_name TEXT;
BEGIN
  -- Use provided name or append " (Test)" to original name
  SELECT COALESCE(clone_user_account.new_name, u.name || ' (Test)') INTO v_new_name
  FROM public.users u WHERE u.id = source_user_id;

  -- Create new user account (clone base user data)
  INSERT INTO public.users (
    email,
    name,
    birth_year,
    profile_photo_url,
    created_at
  )
  SELECT
    clone_user_account.new_email,
    v_new_name,
    birth_year,
    profile_photo_url,
    NOW()
  FROM public.users
  WHERE id = source_user_id
  RETURNING id INTO v_new_user_id;

  -- Clone all stories
  FOR v_old_story_id IN
    SELECT id FROM public.stories WHERE user_id = source_user_id ORDER BY created_at
  LOOP
    -- Insert cloned story
    INSERT INTO public.stories (
      user_id,
      title,
      transcript,
      audio_url,
      story_year,
      year,
      age,
      decade,
      date_precision,
      wisdom_text,
      is_favorite,
      is_private,
      created_at,
      updated_at
    )
    SELECT
      v_new_user_id,
      title,
      transcript,
      audio_url,
      story_year,
      year,
      age,
      decade,
      date_precision,
      wisdom_text,
      is_favorite,
      is_private,
      created_at,
      updated_at
    FROM public.stories
    WHERE id = v_old_story_id
    RETURNING id INTO v_new_story_id;

    -- Track story mapping for photo cloning
    v_story_mapping := jsonb_set(
      v_story_mapping,
      ARRAY[v_old_story_id::TEXT],
      to_jsonb(v_new_story_id)
    );

    v_stories_cloned := v_stories_cloned + 1;

    -- Clone story photos
    INSERT INTO public.story_photos (
      story_id,
      photo_url,
      caption,
      is_hero,
      display_order,
      created_at
    )
    SELECT
      v_new_story_id,
      photo_url,
      caption,
      is_hero,
      display_order,
      created_at
    FROM public.story_photos
    WHERE story_id = v_old_story_id;

    GET DIAGNOSTICS v_photos_this_story = ROW_COUNT;
    v_photos_cloned := v_photos_cloned + v_photos_this_story;
  END LOOP;

  -- Update user's story count
  UPDATE public.users
  SET story_count = v_stories_cloned
  WHERE id = v_new_user_id;

  RETURN QUERY SELECT v_new_user_id, v_stories_cloned, v_photos_cloned;
END;
$$;

-- 2. Fix set_user_story_milestone
CREATE OR REPLACE FUNCTION public.set_user_story_milestone(
  target_user_id UUID,
  target_story_count INT
)
RETURNS TABLE(
  visible_stories INT,
  hidden_stories INT
)
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_total_stories INT;
  v_visible_stories INT;
  v_hidden_stories INT;
BEGIN
  -- Get total stories
  SELECT COUNT(*) INTO v_total_stories
  FROM public.stories
  WHERE user_id = target_user_id;

  IF target_story_count > v_total_stories THEN
    RAISE EXCEPTION 'Cannot set milestone to % stories (user only has % total)',
      target_story_count, v_total_stories;
  END IF;

  -- Mark first N stories as visible (is_private = false)
  -- Mark rest as hidden (is_private = true)
  WITH ranked_stories AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM public.stories
    WHERE user_id = target_user_id
  )
  UPDATE public.stories
  SET is_private = CASE
    WHEN rs.rn <= target_story_count THEN false
    ELSE true
  END
  FROM ranked_stories rs
  WHERE public.stories.id = rs.id;

  -- Update user's story_count
  UPDATE public.users
  SET story_count = target_story_count
  WHERE id = target_user_id;

  -- Count visible/hidden
  SELECT
    COUNT(*) FILTER (WHERE NOT is_private),
    COUNT(*) FILTER (WHERE is_private)
  INTO v_visible_stories, v_hidden_stories
  FROM public.stories
  WHERE user_id = target_user_id;

  RETURN QUERY SELECT v_visible_stories, v_hidden_stories;
END;
$$;

-- 3. Fix clean_test_prompts
CREATE OR REPLACE FUNCTION public.clean_test_prompts(
  target_user_id UUID
)
RETURNS TABLE(
  active_prompts_deleted INT,
  prompt_history_deleted INT,
  character_evolution_deleted INT
)
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_active_deleted INT := 0;
  v_history_deleted INT := 0;
  v_evolution_deleted INT := 0;
BEGIN
  -- Delete active prompts
  DELETE FROM public.active_prompts
  WHERE user_id = target_user_id;
  GET DIAGNOSTICS v_active_deleted = ROW_COUNT;

  -- Delete prompt history
  DELETE FROM public.prompt_history
  WHERE user_id = target_user_id;
  GET DIAGNOSTICS v_history_deleted = ROW_COUNT;

  -- Delete character evolution
  DELETE FROM public.character_evolution
  WHERE user_id = target_user_id;
  GET DIAGNOSTICS v_evolution_deleted = ROW_COUNT;

  RETURN QUERY SELECT v_active_deleted, v_history_deleted, v_evolution_deleted;
END;
$$;

-- 4. Fix get_test_account_info
CREATE OR REPLACE FUNCTION public.get_test_account_info(
  target_user_id UUID
)
RETURNS TABLE(
  user_email TEXT,
  user_name TEXT,
  total_stories INT,
  visible_stories INT,
  active_prompts INT,
  prompt_history INT,
  has_character_evolution BOOLEAN
)
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.email,
    u.name,
    (SELECT COUNT(*)::INT FROM public.stories WHERE user_id = target_user_id),
    (SELECT COUNT(*)::INT FROM public.stories WHERE user_id = target_user_id AND NOT is_private),
    (SELECT COUNT(*)::INT FROM public.active_prompts WHERE user_id = target_user_id),
    (SELECT COUNT(*)::INT FROM public.prompt_history WHERE user_id = target_user_id),
    EXISTS(SELECT 1 FROM public.character_evolution WHERE user_id = target_user_id)
  FROM public.users u
  WHERE u.id = target_user_id;
END;
$$;

-- Restore comments
COMMENT ON FUNCTION public.clone_user_account IS 'Creates a complete copy of a user account with all stories and photos. Does not copy prompts (they get regenerated in tests).';
COMMENT ON FUNCTION public.set_user_story_milestone IS 'Adjusts visible story count to simulate different milestones (1, 2, 3, 4, 7, 10, etc.). Hides/reveals stories as needed.';
COMMENT ON FUNCTION public.clean_test_prompts IS 'Removes all prompts and character evolution for a test account. Useful before re-running prompt generation.';
COMMENT ON FUNCTION public.get_test_account_info IS 'Returns summary of test account data (story counts, prompt counts, etc.).';
