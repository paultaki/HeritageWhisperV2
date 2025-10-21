-- Migration: Fix Missing RLS on Critical Tables
-- Created: 2025-01-21
-- Description: Enable RLS on tables flagged by Supabase security linter
-- Issue: users, recording_sessions, stories, usage_tracking tables missing RLS

-- ============================================================================
-- USERS TABLE RLS (Re-enable if disabled)
-- ============================================================================

-- First check and enable RLS on users table
DO $$
BEGIN
    -- Check if RLS is disabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'users'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on users table';
    ELSE
        RAISE NOTICE 'RLS already enabled on users table';
    END IF;
END $$;

-- Ensure policies exist for users table
DO $$
BEGIN
    -- Drop and recreate policies to ensure they're correct
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    DROP POLICY IF EXISTS "Service role has full access to users" ON public.users;

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
        (role = (SELECT role FROM public.users WHERE id = (SELECT auth.uid())) OR role IS NULL)
    );

    -- Service role has full access
    CREATE POLICY "Service role has full access to users"
    ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

    RAISE NOTICE 'Created/updated policies for users table';
END $$;

-- ============================================================================
-- RECORDING_SESSIONS TABLE RLS
-- ============================================================================

-- Check and enable RLS on recording_sessions table
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'recording_sessions'
    ) THEN
        -- Enable RLS
        ALTER TABLE public.recording_sessions ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their own recording sessions" ON public.recording_sessions;
        DROP POLICY IF EXISTS "Users can insert their own recording sessions" ON public.recording_sessions;
        DROP POLICY IF EXISTS "Users can update their own recording sessions" ON public.recording_sessions;
        DROP POLICY IF EXISTS "Users can delete their own recording sessions" ON public.recording_sessions;
        DROP POLICY IF EXISTS "Service role has full access to recording_sessions" ON public.recording_sessions;

        -- Check if user_id column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'recording_sessions'
            AND column_name = 'user_id'
        ) THEN
            -- Create user policies
            CREATE POLICY "Users can view their own recording sessions"
            ON public.recording_sessions
            FOR SELECT
            USING (user_id = (SELECT auth.uid()));

            CREATE POLICY "Users can insert their own recording sessions"
            ON public.recording_sessions
            FOR INSERT
            WITH CHECK (user_id = (SELECT auth.uid()));

            CREATE POLICY "Users can update their own recording sessions"
            ON public.recording_sessions
            FOR UPDATE
            USING (user_id = (SELECT auth.uid()))
            WITH CHECK (user_id = (SELECT auth.uid()));

            CREATE POLICY "Users can delete their own recording sessions"
            ON public.recording_sessions
            FOR DELETE
            USING (user_id = (SELECT auth.uid()));
        END IF;

        -- Service role always has full access
        CREATE POLICY "Service role has full access to recording_sessions"
        ON public.recording_sessions
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);

        RAISE NOTICE 'Enabled RLS and created policies for recording_sessions table';
    ELSE
        RAISE NOTICE 'recording_sessions table does not exist';
    END IF;
END $$;

-- ============================================================================
-- STORIES TABLE RLS (Re-enable if disabled)
-- ============================================================================

DO $$
BEGIN
    -- Check if RLS is disabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'stories'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on stories table';
    ELSE
        RAISE NOTICE 'RLS already enabled on stories table';
    END IF;
END $$;

-- Ensure policies exist for stories table
DO $$
BEGIN
    -- Drop and recreate policies
    DROP POLICY IF EXISTS "Users can view their own stories" ON public.stories;
    DROP POLICY IF EXISTS "Users can insert their own stories" ON public.stories;
    DROP POLICY IF EXISTS "Users can update their own stories" ON public.stories;
    DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;
    DROP POLICY IF EXISTS "Service role has full access to stories" ON public.stories;

    -- Users can only read their own stories
    CREATE POLICY "Users can view their own stories"
    ON public.stories
    FOR SELECT
    USING (user_id = (SELECT auth.uid()));

    -- Users can only insert their own stories
    CREATE POLICY "Users can insert their own stories"
    ON public.stories
    FOR INSERT
    WITH CHECK (user_id = (SELECT auth.uid()));

    -- Users can only update their own stories
    CREATE POLICY "Users can update their own stories"
    ON public.stories
    FOR UPDATE
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

    -- Users can only delete their own stories
    CREATE POLICY "Users can delete their own stories"
    ON public.stories
    FOR DELETE
    USING (user_id = (SELECT auth.uid()));

    -- Service role can access all stories
    CREATE POLICY "Service role has full access to stories"
    ON public.stories
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

    RAISE NOTICE 'Created/updated policies for stories table';
END $$;

-- ============================================================================
-- USAGE_TRACKING TABLE RLS
-- ============================================================================

DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'usage_tracking'
    ) THEN
        -- Enable RLS
        ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their own usage" ON public.usage_tracking;
        DROP POLICY IF EXISTS "Users can insert their own usage" ON public.usage_tracking;
        DROP POLICY IF EXISTS "Service role has full access to usage_tracking" ON public.usage_tracking;

        -- Check if user_id column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'usage_tracking'
            AND column_name = 'user_id'
        ) THEN
            -- Create user policies
            CREATE POLICY "Users can view their own usage"
            ON public.usage_tracking
            FOR SELECT
            USING (user_id = (SELECT auth.uid()));

            CREATE POLICY "Users can insert their own usage"
            ON public.usage_tracking
            FOR INSERT
            WITH CHECK (user_id = (SELECT auth.uid()));
        END IF;

        -- Service role always has full access
        CREATE POLICY "Service role has full access to usage_tracking"
        ON public.usage_tracking
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);

        RAISE NOTICE 'Enabled RLS and created policies for usage_tracking table';
    ELSE
        RAISE NOTICE 'usage_tracking table does not exist';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show RLS status for the affected tables
SELECT
    tablename,
    rowsecurity,
    CASE
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled - SECURITY RISK!'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'recording_sessions', 'stories', 'usage_tracking')
ORDER BY tablename;

-- Count policies for each table
SELECT
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'recording_sessions', 'stories', 'usage_tracking')
GROUP BY tablename
ORDER BY tablename;

-- Final verification of all public tables
SELECT
    tablename,
    rowsecurity,
    CASE
        WHEN tablename IN ('schema_migrations', 'spatial_ref_sys', 'geography_columns', 'geometry_columns') THEN '⚪ System table - RLS not required'
        WHEN rowsecurity THEN '✅ Protected'
        ELSE '❌ VULNERABLE - RLS DISABLED!'
    END as security_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity DESC, tablename;

COMMENT ON TABLE public.users IS 'RLS ENABLED - Users can only access their own profile';
COMMENT ON TABLE public.recording_sessions IS 'RLS ENABLED - Users can only access their own sessions';
COMMENT ON TABLE public.stories IS 'RLS ENABLED - Users can only access their own stories';
COMMENT ON TABLE public.usage_tracking IS 'RLS ENABLED - Users can only access their own usage data';