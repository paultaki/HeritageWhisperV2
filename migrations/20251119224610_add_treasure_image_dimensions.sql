-- Migration: Add image dimensions to treasures table
-- Date: 2025-11-19
-- Description: Store original image width and height for proper display and portrait detection

-- Add image dimension columns to treasures table
ALTER TABLE treasures
  ADD COLUMN IF NOT EXISTS image_width INTEGER,
  ADD COLUMN IF NOT EXISTS image_height INTEGER;

-- Add comment explaining these fields
COMMENT ON COLUMN treasures.image_width IS 'Original image width in pixels (from master WebP)';
COMMENT ON COLUMN treasures.image_height IS 'Original image height in pixels (from master WebP)';

-- Create index for portrait queries (height > width * 1.15)
CREATE INDEX IF NOT EXISTS idx_treasures_portrait
  ON treasures (image_width, image_height)
  WHERE image_width IS NOT NULL AND image_height IS NOT NULL;
