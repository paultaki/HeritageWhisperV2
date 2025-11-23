-- Migration: Create stripe_customers table
-- Created: 2025-11-23
-- Purpose: Store Stripe subscription data separately from users table

-- Create stripe_customers table
CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired', 'paused')),
  plan_type TEXT DEFAULT 'founding_family',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_customer_id ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_subscription_id ON stripe_customers(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_status ON stripe_customers(status);

-- Enable Row Level Security
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own Stripe data
CREATE POLICY "Users can view own stripe data"
  ON stripe_customers
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- RLS Policy: Service role can do everything (for webhooks and admin operations)
CREATE POLICY "Service role full access"
  ON stripe_customers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_stripe_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on row changes
CREATE TRIGGER stripe_customers_updated_at
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_stripe_customers_updated_at();

-- Grant permissions
GRANT SELECT ON stripe_customers TO authenticated;
GRANT ALL ON stripe_customers TO service_role;

-- Comments for documentation
COMMENT ON TABLE stripe_customers IS 'Stores Stripe subscription data for users';
COMMENT ON COLUMN stripe_customers.user_id IS 'Reference to auth.users - unique constraint ensures one Stripe customer per user';
COMMENT ON COLUMN stripe_customers.stripe_customer_id IS 'Stripe customer ID (cus_xxx)';
COMMENT ON COLUMN stripe_customers.stripe_subscription_id IS 'Stripe subscription ID (sub_xxx)';
COMMENT ON COLUMN stripe_customers.status IS 'Stripe subscription status - synced via webhooks';
COMMENT ON COLUMN stripe_customers.plan_type IS 'Plan identifier (founding_family, premium, etc.)';
COMMENT ON COLUMN stripe_customers.current_period_end IS 'When current subscription period ends';
COMMENT ON COLUMN stripe_customers.cancel_at_period_end IS 'Whether subscription will cancel at period end';
