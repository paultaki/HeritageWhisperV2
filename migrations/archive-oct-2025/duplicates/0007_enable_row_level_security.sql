-- Migration: Enable Row Level Security on Critical Tables
-- Created: 2025-10-15
-- Description: Add defense-in-depth with database-level access control

-- Drop existing policies first (idempotent - safe to run multiple times)
DO $$
BEGIN
    -- Drop all existing RLS policies to make migration idempotent
    DROP POLICY IF EXISTS "Users can view their own stories" ON public.stories;
    DROP POLICY IF EXISTS "Users can insert their own stories" ON public.stories;
    DROP POLICY IF EXISTS "Users can update their own stories" ON public.stories;
    DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;
    DROP POLICY IF EXISTS "Service role has full access to stories" ON public.stories;
    DROP POLICY IF EXISTS "Users can view their own prompts" ON public.active_prompts;
    DROP POLICY IF EXISTS "Users can insert their own prompts" ON public.active_prompts;
    DROP POLICY IF EXISTS "Users can update their own prompts" ON public.active_prompts;
    DROP POLICY IF EXISTS "Users can delete their own prompts" ON public.active_prompts;
    DROP POLICY IF EXISTS "Service role has full access to active_prompts" ON public.active_prompts;
    DROP POLICY IF EXISTS "Users can view their own prompt history" ON public.prompt_history;
    DROP POLICY IF EXISTS "Users can insert their own prompt history" ON public.prompt_history;
    DROP POLICY IF EXISTS "Service role has full access to prompt_history" ON public.prompt_history;
    DROP POLICY IF EXISTS "Users can view their own family members" ON public.family_members;
    DROP POLICY IF EXISTS "Users can insert their own family members" ON public.family_members;
    DROP POLICY IF EXISTS "Users can update their own family members" ON public.family_members;
    DROP POLICY IF EXISTS "Users can delete their own family members" ON public.family_members;
    DROP POLICY IF EXISTS "Service role has full access to family_members" ON public.family_members;
    DROP POLICY IF EXISTS "Service role has full access to family_sessions" ON public.family_sessions;
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
    DROP POLICY IF EXISTS "Service role has full access to users" ON public.users;
    DROP POLICY IF EXISTS "Admins can view audit log" ON public.admin_audit_log;
    DROP POLICY IF EXISTS "Service role can insert audit log" ON public.admin_audit_log;
    DROP POLICY IF EXISTS "Service role has full access to audit_log" ON public.admin_audit_log;
END $$;

-- ============================================================================
-- STORIES TABLE RLS
-- ============================================================================

-- Enable RLS on stories table
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own stories
CREATE POLICY "Users can view their own stories"
ON public.stories
FOR SELECT
USING (user_id = (SELECT auth.uid()));

-- Policy: Users can only insert their own stories
CREATE POLICY "Users can insert their own stories"
ON public.stories
FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

-- Policy: Users can only update their own stories
CREATE POLICY "Users can update their own stories"
ON public.stories
FOR UPDATE
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- Policy: Users can only delete their own stories
CREATE POLICY "Users can delete their own stories"
ON public.stories
FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- Policy: Service role can access all stories (for admin operations)
CREATE POLICY "Service role has full access to stories"
ON public.stories
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ACTIVE PROMPTS TABLE RLS
-- ============================================================================

ALTER TABLE public.active_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prompts"
ON public.active_prompts
FOR SELECT
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own prompts"
ON public.active_prompts
FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own prompts"
ON public.active_prompts
FOR UPDATE
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own prompts"
ON public.active_prompts
FOR DELETE
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role has full access to active_prompts"
ON public.active_prompts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PROMPT HISTORY TABLE RLS
-- ============================================================================

ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prompt history"
ON public.prompt_history
FOR SELECT
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own prompt history"
ON public.prompt_history
FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role has full access to prompt_history"
ON public.prompt_history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- FAMILY MEMBERS TABLE RLS
-- ============================================================================

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own family members"
ON public.family_members
FOR SELECT
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own family members"
ON public.family_members
FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own family members"
ON public.family_members
FOR UPDATE
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own family members"
ON public.family_members
FOR DELETE
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role has full access to family_members"
ON public.family_members
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- FAMILY SESSIONS TABLE RLS
-- ============================================================================

ALTER TABLE public.family_sessions ENABLE ROW LEVEL SECURITY;

-- Family sessions accessed via token, not user_id
-- Only service role should access directly
CREATE POLICY "Service role has full access to family_sessions"
ON public.family_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- USERS TABLE RLS
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own record
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
USING (id = (SELECT auth.uid()));

-- Users can update their own record (except role)
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
USING (id = (SELECT auth.uid()))
WITH CHECK (
  id = (SELECT auth.uid()) AND
  -- Prevent users from changing their own role
  role = (SELECT role FROM public.users WHERE id = (SELECT auth.uid()))
);

-- Only service role can insert new users (registration flow)
CREATE POLICY "Service role can insert users"
ON public.users
FOR INSERT
TO service_role
WITH CHECK (true);

-- Service role has full access
CREATE POLICY "Service role has full access to users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ADMIN AUDIT LOG RLS
-- ============================================================================

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit log
CREATE POLICY "Admins can view audit log"
ON public.admin_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Service role can insert audit log entries
CREATE POLICY "Service role can insert audit log"
ON public.admin_audit_log
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role has full access to audit_log"
ON public.admin_audit_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify RLS is enabled on critical tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('stories', 'users', 'active_prompts', 'prompt_history', 'family_members', 'family_sessions', 'admin_audit_log')
ORDER BY tablename;

COMMENT ON TABLE public.stories IS 'RLS enabled - users can only access their own stories';
COMMENT ON TABLE public.users IS 'RLS enabled - users can only view/update their own profile';
COMMENT ON TABLE public.active_prompts IS 'RLS enabled - users can only access their own prompts';
