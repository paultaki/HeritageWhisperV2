-- Migration: Add beta_codes table for invite-only beta system
-- Created: 2025-01-15
-- Purpose: Track beta invite codes for private beta launch

CREATE TABLE IF NOT EXISTS public.beta_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  issued_to_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  expires_at timestamptz,
  revoked boolean NOT NULL DEFAULT false
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_beta_codes_code ON public.beta_codes(code);
CREATE INDEX IF NOT EXISTS idx_beta_codes_issued_to_user_id ON public.beta_codes(issued_to_user_id);
CREATE INDEX IF NOT EXISTS idx_beta_codes_used_by_user_id ON public.beta_codes(used_by_user_id);
CREATE INDEX IF NOT EXISTS idx_beta_codes_used_at ON public.beta_codes(used_at);

-- Enable Row Level Security
ALTER TABLE public.beta_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read codes issued to them
CREATE POLICY "Users can read their own issued codes"
  ON public.beta_codes
  FOR SELECT
  USING (
    auth.uid() = issued_to_user_id
  );

-- RLS Policy: Service role can do anything (for admin operations and server actions)
CREATE POLICY "Service role has full access"
  ON public.beta_codes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.beta_codes TO authenticated;
GRANT ALL ON public.beta_codes TO service_role;

-- Documentation
COMMENT ON TABLE public.beta_codes IS 'Beta invite codes for private beta access. Each code is single-use and can be issued to specific users or created as generic codes for distribution.';
COMMENT ON COLUMN public.beta_codes.code IS 'The beta invite code (8 characters, uppercase alphanumeric, excluding confusing characters)';
COMMENT ON COLUMN public.beta_codes.issued_to_user_id IS 'User who received this code (nullable for admin-generated generic codes)';
COMMENT ON COLUMN public.beta_codes.used_by_user_id IS 'User who used this code to sign up (nullable until used)';
COMMENT ON COLUMN public.beta_codes.revoked IS 'Whether this code has been manually revoked by an admin';
