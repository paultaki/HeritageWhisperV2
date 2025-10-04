-- Add User Agreements Tracking to Existing HeritageWhisper Database
-- This works with your actual Supabase schema (uses auth.users, not public.users)

-- Create users table in public schema if it doesn't exist
-- This mirrors auth.users for application-specific data
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  name text DEFAULT 'User',
  birth_year integer,
  bio text,
  profile_photo_url text,
  story_count integer DEFAULT 0,
  is_paid boolean DEFAULT false,
  latest_terms_version text,
  latest_privacy_version text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user agreements table
CREATE TABLE IF NOT EXISTS public.user_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreement_type text NOT NULL CHECK (agreement_type IN ('terms', 'privacy')),
  version text NOT NULL,
  accepted_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  method text NOT NULL DEFAULT 'signup' CHECK (method IN ('signup', 'reacceptance', 'oauth'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_user_agreements_user_id ON public.user_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agreements_type_version ON public.user_agreements(agreement_type, version);
CREATE INDEX IF NOT EXISTS idx_user_agreements_accepted_at ON public.user_agreements(accepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_agreements_user_type ON public.user_agreements(user_id, agreement_type);

-- Add helpful comments
COMMENT ON TABLE public.users IS 'Application-specific user data (links to auth.users)';
COMMENT ON TABLE public.user_agreements IS 'Tracks user acceptance of Terms of Service and Privacy Policy with version history';
COMMENT ON COLUMN public.user_agreements.agreement_type IS 'Type of agreement: terms or privacy';
COMMENT ON COLUMN public.user_agreements.version IS 'Version number of the agreement (e.g., 1.0, 1.1, 2.0)';
COMMENT ON COLUMN public.user_agreements.method IS 'How the agreement was accepted: signup, reacceptance, or oauth';
COMMENT ON COLUMN public.users.latest_terms_version IS 'Most recent Terms of Service version accepted by user';
COMMENT ON COLUMN public.users.latest_privacy_version IS 'Most recent Privacy Policy version accepted by user';

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_agreements ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create policies for user_agreements table
CREATE POLICY "Users can view own agreements"
  ON public.user_agreements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all agreements"
  ON public.user_agreements FOR ALL
  USING (true);
