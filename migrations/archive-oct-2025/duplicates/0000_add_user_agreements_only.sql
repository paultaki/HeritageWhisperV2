-- Add User Agreements Tracking to Existing Database
-- This adds ONLY the agreement tracking columns and table to your existing schema

-- Add version tracking columns to existing users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS latest_terms_version TEXT,
ADD COLUMN IF NOT EXISTS latest_privacy_version TEXT;

-- Create user agreements table
CREATE TABLE IF NOT EXISTS user_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agreement_type TEXT NOT NULL CHECK (agreement_type IN ('terms', 'privacy')),
  version TEXT NOT NULL,
  accepted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  method TEXT NOT NULL DEFAULT 'signup' CHECK (method IN ('signup', 'reacceptance', 'oauth'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_agreements_user_id ON user_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agreements_type_version ON user_agreements(agreement_type, version);
CREATE INDEX IF NOT EXISTS idx_user_agreements_accepted_at ON user_agreements(accepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_agreements_user_type ON user_agreements(user_id, agreement_type);

-- Add helpful comments
COMMENT ON TABLE user_agreements IS 'Tracks user acceptance of Terms of Service and Privacy Policy with version history';
COMMENT ON COLUMN user_agreements.agreement_type IS 'Type of agreement: terms or privacy';
COMMENT ON COLUMN user_agreements.version IS 'Version number of the agreement (e.g., 1.0, 1.1, 2.0)';
COMMENT ON COLUMN user_agreements.method IS 'How the agreement was accepted: signup, reacceptance, or oauth';
COMMENT ON COLUMN users.latest_terms_version IS 'Most recent Terms of Service version accepted by user';
COMMENT ON COLUMN users.latest_privacy_version IS 'Most recent Privacy Policy version accepted by user';
