-- Migration: Add transform field to treasures table for zoom/pan support
-- Created: 2025-01-08
-- Purpose: Store image zoom and position transforms for treasure images

ALTER TABLE treasures
ADD COLUMN IF NOT EXISTS transform jsonb;

-- Add comment explaining the field structure
COMMENT ON COLUMN treasures.transform IS 'Image transform data with zoom and position: {"zoom": number, "position": {"x": number, "y": number}}';
