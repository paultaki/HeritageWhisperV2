-- Migration: Create family_sessions table
-- Purpose: Track active family member sessions with security features
-- Date: 2025-11-09

CREATE TABLE IF NOT EXISTS public.family_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  absolute_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast token lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_family_sessions_token
  ON public.family_sessions(token);

-- Index for cleanup queries (expired sessions)
CREATE INDEX IF NOT EXISTS idx_family_sessions_expires_at
  ON public.family_sessions(expires_at);

-- Index for member session lookups
CREATE INDEX IF NOT EXISTS idx_family_sessions_family_member_id
  ON public.family_sessions(family_member_id);

-- Enable Row Level Security
ALTER TABLE public.family_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role only (sessions are managed server-side)
CREATE POLICY "Service role can manage all family sessions"
  ON public.family_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.family_sessions IS 'Active family member sessions with 30-day renewable expiry and 90-day absolute limit';
COMMENT ON COLUMN public.family_sessions.expires_at IS 'Renewable expiry - extends on activity up to 30 days';
COMMENT ON COLUMN public.family_sessions.absolute_expires_at IS 'Hard limit - cannot be extended beyond 90 days from creation';
