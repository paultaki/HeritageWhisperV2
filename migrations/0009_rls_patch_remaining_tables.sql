-- Migration: RLS Patch for Remaining Tables
-- Created: 2025-10-15
-- Description: Enable RLS on family_prompts and any other missed tables

-- ============================================================================
-- FAMILY PROMPTS TABLE RLS (if exists)
-- ============================================================================

-- Enable RLS on family_prompts table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'family_prompts') THEN
        -- Drop existing policies first
        DROP POLICY IF EXISTS "Users can view their own family prompts" ON public.family_prompts;
        DROP POLICY IF EXISTS "Users can insert their own family prompts" ON public.family_prompts;
        DROP POLICY IF EXISTS "Users can update their own family prompts" ON public.family_prompts;
        DROP POLICY IF EXISTS "Users can delete their own family prompts" ON public.family_prompts;
        DROP POLICY IF EXISTS "Service role has full access to family_prompts" ON public.family_prompts;

        -- Enable RLS
        ALTER TABLE public.family_prompts ENABLE ROW LEVEL SECURITY;

        -- Create policies (assuming user_id column exists)
        IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'family_prompts'
            AND column_name = 'user_id'
        ) THEN
            CREATE POLICY "Users can view their own family prompts"
            ON public.family_prompts
            FOR SELECT
            USING (user_id = (SELECT auth.uid()));

            CREATE POLICY "Users can insert their own family prompts"
            ON public.family_prompts
            FOR INSERT
            WITH CHECK (user_id = (SELECT auth.uid()));

            CREATE POLICY "Users can update their own family prompts"
            ON public.family_prompts
            FOR UPDATE
            USING (user_id = (SELECT auth.uid()));

            CREATE POLICY "Users can delete their own family prompts"
            ON public.family_prompts
            FOR DELETE
            USING (user_id = (SELECT auth.uid()));
        END IF;

        -- Service role always has full access
        CREATE POLICY "Service role has full access to family_prompts"
        ON public.family_prompts
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);

        RAISE NOTICE 'RLS enabled on family_prompts table';
    ELSE
        RAISE NOTICE 'family_prompts table does not exist, skipping';
    END IF;
END $$;

-- ============================================================================
-- ENABLE RLS ON ANY OTHER PUBLIC TABLES
-- ============================================================================

-- Find and enable RLS on any remaining public tables without RLS
-- This is a safety net to catch any tables we might have missed

DO $$
DECLARE
    tbl_name TEXT;
BEGIN
    -- Loop through all public tables without RLS enabled
    FOR tbl_name IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND rowsecurity = false
        AND tablename NOT IN (
            -- Exclude tables that shouldn't have RLS
            'schema_migrations',
            'spatial_ref_sys',  -- PostGIS table
            'geography_columns', -- PostGIS table
            'geometry_columns'   -- PostGIS table
        )
    LOOP
        -- Enable RLS on each table
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl_name);

        -- Add service role policy (admin access)
        EXECUTE format('
            CREATE POLICY "Service role has full access"
            ON public.%I
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true)
        ', tbl_name);

        RAISE NOTICE 'Enabled RLS on table: %', tbl_name;
    END LOOP;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show all tables and their RLS status
SELECT
    schemaname,
    tablename,
    rowsecurity,
    CASE
        WHEN rowsecurity THEN '✅ Enabled'
        ELSE '❌ Disabled'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity DESC, tablename;

-- Count policies per table
SELECT
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY policy_count DESC, tablename;

COMMENT ON TABLE public.family_prompts IS 'RLS enabled - users can only access their own prompts';
