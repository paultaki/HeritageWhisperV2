-- Migration: Add photos column and consolidate photo data
-- Date: 2025-11-08
-- Purpose: Migrate all photo data to dedicated photos JSONB column
--
-- CORRECTED VERSION - Works with actual database schema
--
-- Key fixes:
-- - photo_transform is in metadata.photo_transform (not a column)
-- - photos may exist in metadata.photos (needs consolidation)
-- - photo_url is the legacy single photo column

BEGIN;

-- Step 1: Add photos column to stories table if it doesn't exist
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

-- Step 2: Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_stories_photos ON stories USING gin (photos);

-- Step 3: Migrate legacy single photo data to photos array
-- This handles stories that have photo_url but no photos array yet
UPDATE stories
SET photos = CASE
  WHEN photos IS NULL OR photos = '[]'::jsonb THEN
    -- If no photos array exists, create one from legacy fields
    CASE
      WHEN photo_url IS NOT NULL THEN
        jsonb_build_array(
          jsonb_build_object(
            'id', gen_random_uuid()::text,
            'url', photo_url,
            'filePath', photo_url,
            'transform', COALESCE(metadata->'photo_transform', 'null'::jsonb),
            'isHero', true
          )
        )
      ELSE '[]'::jsonb
    END
  ELSE
    -- Photos array already exists, keep it
    photos
END,
    updated_at = NOW()
WHERE photo_url IS NOT NULL OR (metadata->'photo_transform') IS NOT NULL;

-- Step 4: Migrate photos from metadata.photos to top-level photos column
-- This handles stories where photos were stored in metadata
UPDATE stories
SET photos = COALESCE(metadata->'photos', '[]'::jsonb),
    updated_at = NOW()
WHERE metadata ? 'photos'
  AND metadata->'photos' != 'null'::jsonb
  AND (photos IS NULL OR photos = '[]'::jsonb);

-- Step 5: Clean up duplicate photo data from metadata
-- Remove photo-related fields that are now in dedicated photos column
UPDATE stories
SET metadata = metadata - 'photo_transform' - 'photos',
    updated_at = NOW()
WHERE metadata ? 'photo_transform' OR metadata ? 'photos';

-- Step 6: Add comment explaining the column structure
COMMENT ON COLUMN stories.photos IS
  'Array of photo objects with dual WebP paths (masterPath, displayPath), transforms, and captions.
   Replaces legacy photo_url + metadata.photo_transform + metadata.photos patterns.

   Structure: [{ id, masterPath?, displayPath?, url?, filePath?, transform?, caption?, isHero? }]';

-- Step 7: Verification and reporting
DO $$
DECLARE
  total_stories INTEGER;
  stories_with_legacy_photo INTEGER;
  stories_with_metadata_photos INTEGER;
  stories_with_new_photos INTEGER;
  legacy_photos_migrated INTEGER;
BEGIN
  -- Count totals
  SELECT COUNT(*) INTO total_stories FROM stories;

  SELECT COUNT(*) INTO stories_with_legacy_photo
  FROM stories
  WHERE photo_url IS NOT NULL;

  SELECT COUNT(*) INTO stories_with_metadata_photos
  FROM stories
  WHERE metadata ? 'photos';

  SELECT COUNT(*) INTO stories_with_new_photos
  FROM stories
  WHERE photos IS NOT NULL AND jsonb_array_length(photos) > 0;

  -- Count successful migrations
  SELECT COUNT(*) INTO legacy_photos_migrated
  FROM stories
  WHERE photo_url IS NOT NULL
    AND photos IS NOT NULL
    AND jsonb_array_length(photos) > 0;

  -- Report results
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE 'Migration Complete: Photos Column Consolidation';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE 'Total stories: %', total_stories;
  RAISE NOTICE 'Stories with legacy photo_url: %', stories_with_legacy_photo;
  RAISE NOTICE 'Stories with metadata.photos: %', stories_with_metadata_photos;
  RAISE NOTICE 'Stories with new photos column: %', stories_with_new_photos;
  RAISE NOTICE 'Legacy photos successfully migrated: %', legacy_photos_migrated;
  RAISE NOTICE '════════════════════════════════════════════════════════';

  -- Validation check
  IF stories_with_new_photos < GREATEST(stories_with_legacy_photo, stories_with_metadata_photos) THEN
    RAISE WARNING 'Some photos may not have migrated successfully!';
    RAISE NOTICE 'Expected at least % photos, but got %',
      GREATEST(stories_with_legacy_photo, stories_with_metadata_photos),
      stories_with_new_photos;
  ELSE
    RAISE NOTICE '✓ Migration appears successful!';
  END IF;
END $$;

COMMIT;

-- ════════════════════════════════════════════════════════════════
-- Post-Migration Verification Queries
-- ════════════════════════════════════════════════════════════════

-- Check photo data distribution:
SELECT
  COUNT(*) FILTER (WHERE photo_url IS NOT NULL) as has_legacy_photo_url,
  COUNT(*) FILTER (WHERE metadata ? 'photo_transform') as has_metadata_transform,
  COUNT(*) FILTER (WHERE metadata ? 'photos') as has_metadata_photos,
  COUNT(*) FILTER (WHERE photos IS NOT NULL AND jsonb_array_length(photos) > 0) as has_new_photos_array
FROM stories;

-- View sample migrated stories:
SELECT
  id,
  title,
  photo_url as legacy_photo_url,
  metadata->'photo_transform' as legacy_transform,
  metadata->'photos' as metadata_photos,
  photos as new_photos_array,
  jsonb_array_length(COALESCE(photos, '[]'::jsonb)) as photo_count
FROM stories
WHERE photo_url IS NOT NULL OR (metadata ? 'photos') OR (photos IS NOT NULL AND jsonb_array_length(photos) > 0)
LIMIT 10;
