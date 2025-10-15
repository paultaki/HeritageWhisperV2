-- Migration: Add Family Sharing System
-- Created: 2025-01-XX
-- Description: Enables users to invite family members to view their stories via magic links

-- ============================================================================
-- PART 1: CREATE TABLES
-- ============================================================================

-- Family members table
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  relationship TEXT CHECK (relationship IN ('spouse', 'partner', 'child', 'parent', 'sibling', 'grandparent', 'grandchild', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_accessed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT family_members_user_email_unique UNIQUE(user_id, email)
);

-- Family invite tokens (magic links)
CREATE TABLE IF NOT EXISTS public.family_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Family sessions (separate from user sessions)
CREATE TABLE IF NOT EXISTS public.family_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 2: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_family_members_user_status 
  ON public.family_members(user_id, status);

CREATE INDEX IF NOT EXISTS idx_family_members_email 
  ON public.family_members(email);

CREATE INDEX IF NOT EXISTS idx_family_invites_token 
  ON public.family_invites(token) WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_family_invites_expires 
  ON public.family_invites(expires_at) WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_family_sessions_token 
  ON public.family_sessions(token);

CREATE INDEX IF NOT EXISTS idx_family_sessions_expires 
  ON public.family_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_family_sessions_member 
  ON public.family_sessions(family_member_id, expires_at DESC);

-- ============================================================================
-- PART 3: ENABLE RLS
-- ============================================================================

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 4: CREATE RLS POLICIES
-- ============================================================================

-- Family members policies
CREATE POLICY "Users can view their own family members"
  ON public.family_members
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family members"
  ON public.family_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family members"
  ON public.family_members
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family members"
  ON public.family_members
  FOR DELETE
  USING (auth.uid() = user_id);

-- Family invites policies (service role only for security)
CREATE POLICY "Service role can manage invites"
  ON public.family_invites
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Family sessions policies (service role only for security)
CREATE POLICY "Service role can manage sessions"
  ON public.family_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PART 5: CREATE CLEANUP FUNCTION
-- ============================================================================

-- Function to clean up expired invites and sessions
CREATE OR REPLACE FUNCTION cleanup_expired_family_access() RETURNS void AS $$
BEGIN
  -- Delete expired unused invites
  DELETE FROM public.family_invites 
  WHERE expires_at < NOW() AND used_at IS NULL;
  
  -- Delete expired sessions
  DELETE FROM public.family_sessions 
  WHERE expires_at < NOW();
  
  RAISE NOTICE 'Cleaned up expired family invites and sessions';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 6: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.family_members IS 'Family members invited to view user stories';
COMMENT ON COLUMN public.family_members.status IS 'pending: invite sent, active: accessed at least once, suspended: access revoked';
COMMENT ON COLUMN public.family_members.relationship IS 'Relationship to the user';
COMMENT ON COLUMN public.family_members.access_count IS 'Number of times family member has accessed stories';

COMMENT ON TABLE public.family_invites IS 'Magic link tokens for family member invitations';
COMMENT ON COLUMN public.family_invites.token IS 'Secure random token for magic link (32 bytes)';
COMMENT ON COLUMN public.family_invites.expires_at IS 'Token expires after 7 days';
COMMENT ON COLUMN public.family_invites.used_at IS 'When the invite was first used (one-time use)';

COMMENT ON TABLE public.family_sessions IS 'Active sessions for family members viewing stories';
COMMENT ON COLUMN public.family_sessions.token IS 'Session token (separate from invite token)';
COMMENT ON COLUMN public.family_sessions.expires_at IS 'Session expires after 30 days of inactivity';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
