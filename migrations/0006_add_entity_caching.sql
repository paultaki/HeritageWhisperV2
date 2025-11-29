-- Migration: Add Entity Caching for Cost Optimization
-- Created: 2025-01-12
-- Description: Cache extracted entities to avoid re-extraction on every prompt generation

-- Add entities_extracted column to stories table
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS entities_extracted JSONB;

-- Add index for faster queries when checking if entities exist
CREATE INDEX IF NOT EXISTS idx_stories_entities_extracted 
ON stories USING GIN (entities_extracted);

-- Add comment for documentation
COMMENT ON COLUMN stories.entities_extracted IS 'Cached entities extracted from transcript for Tier 1 prompt generation. Invalidated when story is edited. Format: {people: [], places: [], objects: [], emotions: [], temporalBoundaries: []}';

-- Add updated_at trigger if it doesn't exist
-- This helps invalidate cache when story is edited
-- COMMENTED OUT: update_updated_at_column() is defined in 0010, not available yet
-- Can add this trigger in a later migration if needed
/*
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_stories_updated_at') THEN
    CREATE TRIGGER update_stories_updated_at
    BEFORE UPDATE ON stories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
*/

-- Migration complete
