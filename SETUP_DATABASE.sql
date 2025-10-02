-- ============================================
-- COMPLETE DATABASE SETUP FOR HERITAGEWHISPERV2
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- STEP 1: Create the users table in public schema
-- This mirrors the auth.users but with app-specific data
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    birth_year INTEGER NOT NULL DEFAULT 1970,
    story_count INTEGER DEFAULT 0,
    is_paid BOOLEAN DEFAULT false,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ============================================
-- STEP 2: Create the stories table
-- ============================================

CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    audio_url TEXT,
    transcription TEXT,
    duration_seconds INTEGER,
    wisdom_clip_url TEXT,
    wisdom_clip_text TEXT,
    story_year INTEGER NOT NULL,
    story_date DATE,
    life_age INTEGER,
    photo_url TEXT,
    photo_transform JSONB,
    photos JSONB DEFAULT '[]'::jsonb,
    emotions TEXT[],
    pivotal_category TEXT,
    include_in_book BOOLEAN DEFAULT true,
    include_in_timeline BOOLEAN DEFAULT true,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);

-- ============================================
-- STEP 3: Create the ghost_prompts table
-- ============================================

CREATE TABLE IF NOT EXISTS public.ghost_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    category TEXT NOT NULL,
    decade TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 4: Create the followup_questions table
-- ============================================

CREATE TABLE IF NOT EXISTS public.followup_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    asked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answered BOOLEAN DEFAULT false
);

-- ============================================
-- STEP 5: Create function to auto-create user record
-- When someone registers in auth.users, create their public.users record
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, birth_year)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'birthYear')::INTEGER, 1970)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created_public ON auth.users;

-- Create trigger to auto-create public user record
CREATE TRIGGER on_auth_user_created_public
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================
-- STEP 6: Update function to auto-confirm users
-- (This combines with the public user creation)
-- ============================================

CREATE OR REPLACE FUNCTION public.auto_confirm_and_create_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-confirm the email
    UPDATE auth.users
    SET
        email_confirmed_at = NOW(),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"email_verified": true}'::jsonb
    WHERE id = NEW.id AND email_confirmed_at IS NULL;

    -- Create public user record
    INSERT INTO public.users (id, email, name, birth_year)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'birthYear')::INTEGER, 1970)
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        birth_year = EXCLUDED.birth_year,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger
DROP TRIGGER IF EXISTS auto_confirm_email ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_public ON auth.users;

-- Create combined trigger
CREATE TRIGGER on_auth_user_created_combined
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_confirm_and_create_user();

-- ============================================
-- STEP 7: Set up Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ghost_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_questions ENABLE ROW LEVEL SECURITY;

-- Users can only see/update their own record
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Stories policies
CREATE POLICY "Users can view own stories" ON public.stories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stories" ON public.stories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories" ON public.stories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories" ON public.stories
    FOR DELETE USING (auth.uid() = user_id);

-- Ghost prompts are public read
CREATE POLICY "Anyone can view ghost prompts" ON public.ghost_prompts
    FOR SELECT USING (true);

-- Follow-up questions policies
CREATE POLICY "Users can view own followup questions" ON public.followup_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stories
            WHERE stories.id = followup_questions.story_id
            AND stories.user_id = auth.uid()
        )
    );

-- ============================================
-- STEP 8: Insert sample ghost prompts
-- ============================================

INSERT INTO public.ghost_prompts (title, text, category, decade) VALUES
('First Day of School', 'Tell me about your first day of school. What do you remember?', 'Education', '1950s'),
('Family Dinner', 'Describe a typical family dinner from your childhood.', 'Family', '1950s'),
('Favorite Toy', 'What was your favorite toy or game as a child?', 'Childhood', '1950s'),
('First Job', 'Tell me about your first job. How did you get it?', 'Career', '1960s'),
('Meeting Your Partner', 'How did you meet your spouse or partner?', 'Love', '1970s'),
('Proudest Moment', 'What moment in your life are you most proud of?', 'Achievement', 'Any'),
('Family Traditions', 'What family traditions did you start or continue?', 'Family', 'Any')
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 9: Create storage buckets (if not exists)
-- Note: This needs to be done via Supabase Dashboard
-- ============================================

-- Storage buckets must be created via Supabase Dashboard:
-- 1. Go to Storage section
-- 2. Create bucket named: heritage-whisper-files
-- 3. Make it PUBLIC for read access
-- 4. Create bucket named: audio
-- 5. Make it PUBLIC for read access

-- ============================================
-- STEP 10: Verify everything is set up
-- ============================================

-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'stories', 'ghost_prompts', 'followup_questions');

-- Check triggers exist
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_schema = 'public' OR trigger_schema = 'auth';

-- Check if there are any users
SELECT COUNT(*) as user_count FROM auth.users;
SELECT COUNT(*) as public_user_count FROM public.users;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- If all queries run successfully, your database is now set up!
-- Try registering a new user - they should be auto-confirmed