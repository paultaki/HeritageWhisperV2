-- Migration: Remove Character Traits Feature
-- Created: 2025-01-23
-- Description: Removes character_evolution table and stories.character_insights column
--              as these features are not used in production

-- ============================================================================
-- DROP TABLES
-- ============================================================================

-- Drop character_evolution table (stores traits, invisible rules, contradictions)
DROP TABLE IF EXISTS character_evolution CASCADE;

-- ============================================================================
-- DROP COLUMNS
-- ============================================================================

-- Remove character_insights column from stories table (never populated, dead code)
ALTER TABLE stories DROP COLUMN IF EXISTS character_insights;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify character_evolution table is gone
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'character_evolution'
  ) THEN
    RAISE EXCEPTION 'character_evolution table still exists!';
  END IF;

  RAISE NOTICE '✓ character_evolution table successfully removed';
END $$;

-- Verify character_insights column is gone from stories
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'stories'
    AND column_name = 'character_insights'
  ) THEN
    RAISE EXCEPTION 'stories.character_insights column still exists!';
  END IF;

  RAISE NOTICE '✓ stories.character_insights column successfully removed';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

RAISE NOTICE '🎉 Character traits feature successfully removed';
