-- ============================================================================
-- Performance Fix: Optimize RLS policies on chapters table
-- ============================================================================
-- Wrapping auth.uid() in (select auth.uid()) ensures it's evaluated once
-- per query instead of once per row, significantly improving performance.
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own chapters" ON public.chapters;
DROP POLICY IF EXISTS "Users can insert own chapters" ON public.chapters;
DROP POLICY IF EXISTS "Users can update own chapters" ON public.chapters;
DROP POLICY IF EXISTS "Users can delete own chapters" ON public.chapters;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can view own chapters" ON public.chapters
  FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own chapters" ON public.chapters
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own chapters" ON public.chapters
  FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own chapters" ON public.chapters
  FOR DELETE
  USING (user_id = (select auth.uid()));
