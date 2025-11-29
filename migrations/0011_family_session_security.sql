-- Migration: Family Session Security Enhancements
-- Created: 2025-10-15
-- Description: Auto-expire sessions, add rotation, enforce max lifetime

-- Add absolute expiry field (max session lifetime)
ALTER TABLE public.family_sessions
ADD COLUMN IF NOT EXISTS absolute_expires_at TIMESTAMPTZ;

-- Set absolute expiry for existing sessions (30 days from now)
UPDATE public.family_sessions
SET absolute_expires_at = NOW() + INTERVAL '30 days'
WHERE absolute_expires_at IS NULL;

-- Make absolute_expires_at NOT NULL
ALTER TABLE public.family_sessions
ALTER COLUMN absolute_expires_at SET NOT NULL;

-- Create function to auto-delete expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_family_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete sessions past absolute expiry OR regular expiry
  DELETE FROM public.family_sessions
  WHERE
    expires_at < NOW() OR
    absolute_expires_at < NOW();

  RAISE NOTICE 'Cleaned up expired family sessions';
END;
$$;

-- Create function to rotate session token
CREATE OR REPLACE FUNCTION rotate_family_session_token(
  p_session_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_token TEXT;
BEGIN
  -- Generate new random token (64 characters)
  v_new_token := encode(gen_random_bytes(32), 'hex');

  -- Update session with new token and extend expiry
  UPDATE public.family_sessions
  SET
    token = v_new_token,
    expires_at = NOW() + INTERVAL '7 days',
    last_active_at = NOW()
  WHERE id = p_session_id
    AND expires_at > NOW()  -- Only rotate if not expired
    AND absolute_expires_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or expired';
  END IF;

  RETURN v_new_token;
END;
$$;

-- Create pg_cron job to run cleanup daily (requires pg_cron extension)
-- Note: Uncomment if pg_cron is available in your Supabase instance
-- SELECT cron.schedule(
--   'cleanup-expired-family-sessions',
--   '0 2 * * *',  -- Run at 2 AM daily
--   $$ SELECT cleanup_expired_family_sessions(); $$
-- );

-- Alternative: Create trigger to cleanup on INSERT (less efficient but works without pg_cron)
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only cleanup 10% of the time to avoid overhead
  IF random() < 0.1 THEN
    PERFORM cleanup_expired_family_sessions();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_sessions_on_insert
  AFTER INSERT ON public.family_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_expired_sessions();

-- Index for efficient expiry queries
-- Note: Cannot use NOW() in partial index (not immutable), so create full indexes
CREATE INDEX IF NOT EXISTS idx_family_sessions_expires_at
ON public.family_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_family_sessions_absolute_expires_at
ON public.family_sessions(absolute_expires_at);

COMMENT ON COLUMN public.family_sessions.absolute_expires_at IS 'Absolute max session lifetime - cannot be extended';
COMMENT ON FUNCTION cleanup_expired_family_sessions IS 'Removes all expired family sessions';
COMMENT ON FUNCTION public.rotate_family_session_token(UUID)
  IS 'Rotates session token and extends expiry (up to absolute limit)';

-- Run initial cleanup
SELECT cleanup_expired_family_sessions();
