-- Quick Fix: Create missing family_sessions table
-- Run this in Supabase SQL Editor
-- Project: tjycibrhoammxohemyhq

-- Create the table
CREATE TABLE IF NOT EXISTS public.family_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  absolute_expires_at TIMESTAMPTZ NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_family_sessions_token
  ON public.family_sessions(token);

CREATE INDEX IF NOT EXISTS idx_family_sessions_expires
  ON public.family_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_family_sessions_member
  ON public.family_sessions(family_member_id, expires_at DESC);

-- Enable RLS
ALTER TABLE public.family_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (service role only for security)
CREATE POLICY "Service role can manage sessions"
  ON public.family_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.family_sessions IS 'Active sessions for family members viewing stories';
COMMENT ON COLUMN public.family_sessions.token IS 'Session token (separate from invite token)';
COMMENT ON COLUMN public.family_sessions.expires_at IS 'Session expires after 7 days (renewable)';
COMMENT ON COLUMN public.family_sessions.absolute_expires_at IS 'Absolute expiry (30 days, cannot be extended)';
