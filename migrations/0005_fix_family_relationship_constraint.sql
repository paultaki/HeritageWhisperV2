-- Migration: Fix family_members relationship constraint
-- Created: 2025-01-XX
-- Description: Remove restrictive relationship check constraint to allow any relationship text

-- Drop the existing check constraint
ALTER TABLE public.family_members 
DROP CONSTRAINT IF EXISTS family_members_relationship_check;

-- Relationship can now be any text value or NULL
COMMENT ON COLUMN public.family_members.relationship IS 'Relationship to the user (e.g., Son, Daughter, Spouse, Friend, etc.)';
