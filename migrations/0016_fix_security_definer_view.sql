-- ============================================================================
-- Migration: Fix SECURITY DEFINER view warning
-- Created: 2025-01-21
-- Purpose: Remove SECURITY DEFINER from prompt_quality_stats view to fix security linter warning
-- ============================================================================

-- Drop the existing view (if it exists)
DROP VIEW IF EXISTS public.prompt_quality_stats CASCADE;

-- Recreate the view WITHOUT SECURITY DEFINER
-- This view aggregates prompt feedback statistics for dashboard display
CREATE OR REPLACE VIEW public.prompt_quality_stats AS
SELECT
  rating,
  prompt_tier,
  prompt_type,
  COUNT(*) as count,
  AVG(prompt_score) as avg_score,
  AVG(word_count) as avg_words,
  ARRAY_AGG(DISTINCT tags) FILTER (WHERE tags IS NOT NULL) as common_tags
FROM public.prompt_feedback
GROUP BY rating, prompt_tier, prompt_type;

-- Add comment for documentation
COMMENT ON VIEW public.prompt_quality_stats IS 'Aggregated prompt quality statistics for dashboard (runs with invoker permissions)';

-- Grant appropriate permissions
-- Allow authenticated users to read the view (they can only see aggregated data)
GRANT SELECT ON public.prompt_quality_stats TO authenticated;

-- Ensure the view owner is correct (will run with INVOKER permissions by default)
ALTER VIEW public.prompt_quality_stats OWNER TO postgres;