-- ============================================================================
-- Test Account Infrastructure
-- ============================================================================
-- Enables creating test accounts from production data for milestone testing
-- Date: 2024-10-13

-- ============================================================================
-- 1. Clone User Function
-- ============================================================================
-- Creates a complete copy of a user account with all stories, photos, and metadata
-- Does NOT copy prompts or character evolution (those get regenerated in tests)

CREATE OR REPLACE FUNCTION clone_user_account(
  source_user_id UUID,
  new_email TEXT,
  new_name TEXT DEFAULT NULL
)
RETURNS TABLE(
  new_user_id UUID,
  stories_cloned INT,
  photos_cloned INT
) AS $$
DECLARE
  v_new_user_id UUID;
  v_stories_cloned INT := 0;
  v_photos_cloned INT := 0;
  v_story_mapping JSONB := '{}';
  v_old_story_id UUID;
  v_new_story_id UUID;
  v_new_name TEXT;
BEGIN
  -- Use provided name or append " (Test)" to original name
  SELECT COALESCE(new_name, u.name || ' (Test)') INTO v_new_name
  FROM users u WHERE u.id = source_user_id;

  -- Create new user account (clone base user data)
  INSERT INTO users (
    email,
    name,
    birth_year,
    profile_photo_url,
    created_at
  )
  SELECT
    new_email,
    v_new_name,
    birth_year,
    profile_photo_url,
    NOW()
  FROM users
  WHERE id = source_user_id
  RETURNING id INTO v_new_user_id;

  -- Clone all stories
  FOR v_old_story_id IN
    SELECT id FROM stories WHERE user_id = source_user_id ORDER BY created_at
  LOOP
    -- Insert cloned story
    INSERT INTO stories (
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
    FROM stories
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
    INSERT INTO story_photos (
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
    FROM story_photos
    WHERE story_id = v_old_story_id;

    GET DIAGNOSTICS v_photos_cloned = v_photos_cloned + ROW_COUNT;
  END LOOP;

  -- Update user's story count
  UPDATE users
  SET story_count = v_stories_cloned
  WHERE id = v_new_user_id;

  RETURN QUERY SELECT v_new_user_id, v_stories_cloned, v_photos_cloned;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. Set Milestone Function
-- ============================================================================
-- Adjusts a test account to have exactly N stories (for milestone testing)
-- Hides or reveals stories to reach target count

CREATE OR REPLACE FUNCTION set_user_story_milestone(
  target_user_id UUID,
  target_story_count INT
)
RETURNS TABLE(
  visible_stories INT,
  hidden_stories INT
) AS $$
DECLARE
  v_total_stories INT;
  v_visible_stories INT;
  v_hidden_stories INT;
BEGIN
  -- Get total stories
  SELECT COUNT(*) INTO v_total_stories
  FROM stories
  WHERE user_id = target_user_id;

  IF target_story_count > v_total_stories THEN
    RAISE EXCEPTION 'Cannot set milestone to % stories (user only has % total)', 
      target_story_count, v_total_stories;
  END IF;

  -- Mark first N stories as visible (is_private = false)
  -- Mark rest as hidden (is_private = true)
  WITH ranked_stories AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM stories
    WHERE user_id = target_user_id
  )
  UPDATE stories
  SET is_private = CASE
    WHEN rs.rn <= target_story_count THEN false
    ELSE true
  END
  FROM ranked_stories rs
  WHERE stories.id = rs.id;

  -- Update user's story_count
  UPDATE users
  SET story_count = target_story_count
  WHERE id = target_user_id;

  -- Count visible/hidden
  SELECT 
    COUNT(*) FILTER (WHERE NOT is_private),
    COUNT(*) FILTER (WHERE is_private)
  INTO v_visible_stories, v_hidden_stories
  FROM stories
  WHERE user_id = target_user_id;

  RETURN QUERY SELECT v_visible_stories, v_hidden_stories;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. Clean Test Data Function
-- ============================================================================
-- Removes all prompts and character evolution for a test account
-- Useful for resetting before re-running prompt generation

CREATE OR REPLACE FUNCTION clean_test_prompts(
  target_user_id UUID
)
RETURNS TABLE(
  active_prompts_deleted INT,
  prompt_history_deleted INT,
  character_evolution_deleted INT
) AS $$
DECLARE
  v_active_deleted INT := 0;
  v_history_deleted INT := 0;
  v_evolution_deleted INT := 0;
BEGIN
  -- Delete active prompts
  DELETE FROM active_prompts
  WHERE user_id = target_user_id;
  GET DIAGNOSTICS v_active_deleted = ROW_COUNT;

  -- Delete prompt history
  DELETE FROM prompt_history
  WHERE user_id = target_user_id;
  GET DIAGNOSTICS v_history_deleted = ROW_COUNT;

  -- Delete character evolution
  DELETE FROM character_evolution
  WHERE user_id = target_user_id;
  GET DIAGNOSTICS v_evolution_deleted = ROW_COUNT;

  RETURN QUERY SELECT v_active_deleted, v_history_deleted, v_evolution_deleted;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. Delete Test Account Function
-- ============================================================================
-- Completely removes a test account and all associated data
-- Does NOT delete files from storage (handle separately)

CREATE OR REPLACE FUNCTION delete_test_account(
  target_user_id UUID,
  confirm_email TEXT
)
RETURNS TABLE(
  stories_deleted INT,
  photos_deleted INT,
  prompts_deleted INT
) AS $$
DECLARE
  v_stories_deleted INT := 0;
  v_photos_deleted INT := 0;
  v_prompts_deleted INT := 0;
  v_actual_email TEXT;
BEGIN
  -- Safety check: verify email matches
  SELECT email INTO v_actual_email FROM users WHERE id = target_user_id;
  
  IF v_actual_email IS NULL THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;

  IF v_actual_email != confirm_email THEN
    RAISE EXCEPTION 'Email confirmation failed. Expected: %, Got: %', v_actual_email, confirm_email;
  END IF;

  -- Delete story photos
  DELETE FROM story_photos
  WHERE story_id IN (SELECT id FROM stories WHERE user_id = target_user_id);
  GET DIAGNOSTICS v_photos_deleted = ROW_COUNT;

  -- Delete stories
  DELETE FROM stories
  WHERE user_id = target_user_id;
  GET DIAGNOSTICS v_stories_deleted = ROW_COUNT;

  -- Delete prompts
  DELETE FROM active_prompts WHERE user_id = target_user_id;
  DELETE FROM prompt_history WHERE user_id = target_user_id;
  GET DIAGNOSTICS v_prompts_deleted = ROW_COUNT;

  -- Delete character evolution
  DELETE FROM character_evolution WHERE user_id = target_user_id;

  -- Delete user
  DELETE FROM users WHERE id = target_user_id;

  RETURN QUERY SELECT v_stories_deleted, v_photos_deleted, v_prompts_deleted;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. Get Test Account Info Function
-- ============================================================================
-- Returns summary of a test account's data

CREATE OR REPLACE FUNCTION get_test_account_info(
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
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.email,
    u.name,
    (SELECT COUNT(*)::INT FROM stories WHERE user_id = target_user_id),
    (SELECT COUNT(*)::INT FROM stories WHERE user_id = target_user_id AND NOT is_private),
    (SELECT COUNT(*)::INT FROM active_prompts WHERE user_id = target_user_id),
    (SELECT COUNT(*)::INT FROM prompt_history WHERE user_id = target_user_id),
    EXISTS(SELECT 1 FROM character_evolution WHERE user_id = target_user_id)
  FROM users u
  WHERE u.id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON FUNCTION clone_user_account IS 'Creates a complete copy of a user account with all stories and photos. Does not copy prompts (they get regenerated in tests).';
COMMENT ON FUNCTION set_user_story_milestone IS 'Adjusts visible story count to simulate different milestones (1, 2, 3, 4, 7, 10, etc.). Hides/reveals stories as needed.';
COMMENT ON FUNCTION clean_test_prompts IS 'Removes all prompts and character evolution for a test account. Useful before re-running prompt generation.';
COMMENT ON FUNCTION delete_test_account IS 'Completely removes a test account and all data. Requires email confirmation for safety.';
COMMENT ON FUNCTION get_test_account_info IS 'Returns summary of test account data (story counts, prompt counts, etc.).';

-- ============================================================================
-- Example Usage
-- ============================================================================

-- Clone your account to create test account:
-- SELECT * FROM clone_user_account(
--   'your-user-id-here'::UUID,
--   'test@heritagewhisper.com',
--   'Paul (Test Account)'
-- );

-- Set test account to Story 3 milestone:
-- SELECT * FROM set_user_story_milestone('test-user-id'::UUID, 3);

-- Clean prompts before re-testing:
-- SELECT * FROM clean_test_prompts('test-user-id'::UUID);

-- Delete test account when done:
-- SELECT * FROM delete_test_account('test-user-id'::UUID, 'test@heritagewhisper.com');
