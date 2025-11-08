-- Migration: Add dual WebP columns to treasures table
-- Date: 2025-11-08
-- Purpose: Add master_path and display_path columns for dual WebP support

BEGIN;

-- Add master_path column if it doesn't exist
ALTER TABLE treasures
ADD COLUMN IF NOT EXISTS master_path TEXT;

-- Add display_path column if it doesn't exist
ALTER TABLE treasures
ADD COLUMN IF NOT EXISTS display_path TEXT;

-- Add comments explaining the columns
COMMENT ON COLUMN treasures.master_path IS
  'Path to master WebP file (2400px @ 85% quality) for printing';

COMMENT ON COLUMN treasures.display_path IS
  'Path to display WebP file (550px @ 80% quality) for online viewing';

-- Report results
DO $$
DECLARE
  total_treasures INTEGER;
  treasures_with_image INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_treasures FROM treasures;
  SELECT COUNT(*) INTO treasures_with_image FROM treasures WHERE image_url IS NOT NULL;

  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE 'Migration Complete: Treasures WebP Columns Added';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE 'Total treasures: %', total_treasures;
  RAISE NOTICE 'Treasures with images: %', treasures_with_image;
  RAISE NOTICE 'Ready for WebP migration!';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

COMMIT;

-- Verification query
SELECT
  COUNT(*) as total_treasures,
  COUNT(image_url) as has_image_url,
  COUNT(master_path) as has_master_path,
  COUNT(display_path) as has_display_path
FROM treasures;
