-- ============================================================================
-- VERIFICATION AND FIX SCRIPT FOR PROMPT TABLES
-- Run this in Supabase SQL Editor to verify and fix the prompt system tables
-- ============================================================================

-- STEP 1: Check if tables exist
DO $$
BEGIN
    RAISE NOTICE 'Checking if tables exist...';
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'active_prompts') THEN
        RAISE NOTICE '✓ active_prompts table exists';
    ELSE
        RAISE NOTICE '✗ active_prompts table MISSING';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'prompt_history') THEN
        RAISE NOTICE '✓ prompt_history table exists';
    ELSE
        RAISE NOTICE '✗ prompt_history table MISSING';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'character_evolution') THEN
        RAISE NOTICE '✓ character_evolution table exists';
    ELSE
        RAISE NOTICE '✗ character_evolution table MISSING';
    END IF;
END $$;

-- STEP 2: Check for any data
DO $$
DECLARE
    active_count INTEGER;
    history_count INTEGER;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'active_prompts') THEN
        SELECT COUNT(*) INTO active_count FROM active_prompts;
        RAISE NOTICE 'active_prompts has % rows', active_count;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'prompt_history') THEN
        SELECT COUNT(*) INTO history_count FROM prompt_history;
        RAISE NOTICE 'prompt_history has % rows', history_count;
    END IF;
END $$;

-- STEP 3: Add RLS policies if they don't exist
-- Enable RLS on tables
ALTER TABLE IF EXISTS active_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS prompt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS character_evolution ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own active prompts" ON active_prompts;
DROP POLICY IF EXISTS "Users can insert their own active prompts" ON active_prompts;
DROP POLICY IF EXISTS "Users can update their own active prompts" ON active_prompts;
DROP POLICY IF EXISTS "Users can delete their own active prompts" ON active_prompts;

DROP POLICY IF EXISTS "Users can view their own prompt history" ON prompt_history;
DROP POLICY IF EXISTS "Users can insert their own prompt history" ON prompt_history;
DROP POLICY IF EXISTS "Users can update their own prompt history" ON prompt_history;
DROP POLICY IF EXISTS "Users can delete their own prompt history" ON prompt_history;

DROP POLICY IF EXISTS "Users can view their own character evolution" ON character_evolution;
DROP POLICY IF EXISTS "Users can insert their own character evolution" ON character_evolution;
DROP POLICY IF EXISTS "Users can update their own character evolution" ON character_evolution;

-- Create RLS policies for active_prompts
CREATE POLICY "Users can view their own active prompts" 
ON active_prompts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own active prompts" 
ON active_prompts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own active prompts" 
ON active_prompts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own active prompts" 
ON active_prompts FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for prompt_history
CREATE POLICY "Users can view their own prompt history" 
ON prompt_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompt history" 
ON prompt_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompt history" 
ON prompt_history FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompt history" 
ON prompt_history FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for character_evolution
CREATE POLICY "Users can view their own character evolution" 
ON character_evolution FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own character evolution" 
ON character_evolution FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own character evolution" 
ON character_evolution FOR UPDATE 
USING (auth.uid() = user_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✓ RLS policies created successfully!';
END $$;
