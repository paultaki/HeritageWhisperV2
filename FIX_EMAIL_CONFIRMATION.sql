-- ============================================
-- FIX EMAIL CONFIRMATION ISSUE
-- Run this in Supabase SQL Editor
-- ============================================

-- First, confirm all existing users
UPDATE auth.users
SET
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_combined ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_public ON auth.users;
DROP TRIGGER IF EXISTS auto_confirm_email ON auth.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.auto_confirm_and_create_user();
DROP FUNCTION IF EXISTS public.handle_new_auth_user();

-- Create a simpler auto-confirm function
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Immediately confirm the email
    NEW.email_confirmed_at = NOW();
    NEW.confirmed_at = NOW();

    -- Ensure user exists in public.users table
    INSERT INTO public.users (id, email, name, birth_year, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(
            (NEW.raw_user_meta_data->>'birthYear')::INTEGER,
            EXTRACT(YEAR FROM CURRENT_DATE) - 50
        ),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that runs BEFORE insert to modify the NEW record
CREATE TRIGGER auto_confirm_user_before_insert
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_confirm_new_user();

-- Verify the trigger was created
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
AND trigger_name = 'auto_confirm_user_before_insert';

-- Check if there are any unconfirmed users
SELECT
    email,
    created_at,
    email_confirmed_at,
    CASE
        WHEN email_confirmed_at IS NULL THEN 'NOT CONFIRMED'
        ELSE 'CONFIRMED'
    END as status
FROM auth.users
ORDER BY created_at DESC;

-- ============================================
-- TEST: Create a test user to verify it works
-- ============================================
-- This will be auto-confirmed if the trigger works
-- You can test by registering a new user after running this script