-- Migration: Apply Missing Timestamped Migrations
-- Created: 2025-11-29
-- Description: Consolidates unapplied timestamped migrations into proper sequence
-- Source files:
--   - 20251118121734_add_last_story_notification_sent_at.sql
--   - 20251118223617_add_family_member_email_notifications.sql
--   - 20251123000000_create_stripe_customers_table.sql
--   - 20251128000000_create_gift_codes_table.sql
-- Note: 20251119224610_add_treasure_image_dimensions.sql skipped (already exists via 0022b)

-- ============================================================================
-- PART 1: FAMILY_MEMBERS - Notification Tracking Columns
-- ============================================================================

-- Add last_story_notification_sent_at column
ALTER TABLE public.family_members
ADD COLUMN IF NOT EXISTS last_story_notification_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.family_members.last_story_notification_sent_at IS
'Timestamp of the last story notification email sent to this family member. Used by daily digest cron job to prevent duplicate notifications.';

-- Add email_notifications preference column
ALTER TABLE public.family_members
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.family_members.email_notifications IS
'Whether this family member wants to receive email notifications about new stories. Can be toggled via unsubscribe link in notification emails.';

-- Create indexes for notification queries
CREATE INDEX IF NOT EXISTS idx_family_members_notification_tracking
ON public.family_members(user_id, last_story_notification_sent_at);

CREATE INDEX IF NOT EXISTS idx_family_members_email_notifications
ON public.family_members(user_id, status, email_notifications);

-- ============================================================================
-- PART 2: STRIPE_CUSTOMERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stripe_customers (
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON public.stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_customer_id ON public.stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_subscription_id ON public.stripe_customers(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_status ON public.stripe_customers(status);

-- Enable RLS
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own stripe data" ON public.stripe_customers;
CREATE POLICY "Users can view own stripe data"
  ON public.stripe_customers
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Service role full access on stripe_customers" ON public.stripe_customers;
CREATE POLICY "Service role full access on stripe_customers"
  ON public.stripe_customers
  FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION public.update_stripe_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stripe_customers_updated_at ON public.stripe_customers;
CREATE TRIGGER stripe_customers_updated_at
  BEFORE UPDATE ON public.stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stripe_customers_updated_at();

-- Grants
GRANT SELECT ON public.stripe_customers TO authenticated;
GRANT ALL ON public.stripe_customers TO service_role;

-- Comments
COMMENT ON TABLE public.stripe_customers IS 'Stores Stripe subscription data for users';
COMMENT ON COLUMN public.stripe_customers.user_id IS 'Reference to auth.users - unique constraint ensures one Stripe customer per user';
COMMENT ON COLUMN public.stripe_customers.stripe_customer_id IS 'Stripe customer ID (cus_xxx)';
COMMENT ON COLUMN public.stripe_customers.stripe_subscription_id IS 'Stripe subscription ID (sub_xxx)';
COMMENT ON COLUMN public.stripe_customers.status IS 'Stripe subscription status - synced via webhooks';
COMMENT ON COLUMN public.stripe_customers.plan_type IS 'Plan identifier (founding_family, premium, etc.)';
COMMENT ON COLUMN public.stripe_customers.current_period_end IS 'When current subscription period ends';
COMMENT ON COLUMN public.stripe_customers.cancel_at_period_end IS 'Whether subscription will cancel at period end';

-- ============================================================================
-- PART 3: GIFT_CODES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gift_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_paid_cents INTEGER NOT NULL DEFAULT 7900,
  purchaser_email TEXT NOT NULL,
  purchaser_name TEXT,
  purchaser_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT,
  recipient_name TEXT,
  redeemed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'redeemed', 'expired', 'refunded')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gift_codes_code ON public.gift_codes(code);
CREATE INDEX IF NOT EXISTS idx_gift_codes_status ON public.gift_codes(status);
CREATE INDEX IF NOT EXISTS idx_gift_codes_purchaser_email ON public.gift_codes(purchaser_email);
CREATE INDEX IF NOT EXISTS idx_gift_codes_purchaser_user_id ON public.gift_codes(purchaser_user_id);
CREATE INDEX IF NOT EXISTS idx_gift_codes_redeemed_by_user_id ON public.gift_codes(redeemed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_gift_codes_expires_at ON public.gift_codes(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_gift_codes_stripe_session ON public.gift_codes(stripe_checkout_session_id);

-- Enable RLS
ALTER TABLE public.gift_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Purchasers can view their own gifts" ON public.gift_codes;
CREATE POLICY "Purchasers can view their own gifts"
  ON public.gift_codes
  FOR SELECT
  USING (
    purchaser_user_id = (SELECT auth.uid())
    OR purchaser_email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Recipients can view their redeemed gifts" ON public.gift_codes;
CREATE POLICY "Recipients can view their redeemed gifts"
  ON public.gift_codes
  FOR SELECT
  USING (redeemed_by_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Service role full access on gift_codes" ON public.gift_codes;
CREATE POLICY "Service role full access on gift_codes"
  ON public.gift_codes
  FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION public.update_gift_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gift_codes_updated_at ON public.gift_codes;
CREATE TRIGGER gift_codes_updated_at
  BEFORE UPDATE ON public.gift_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gift_codes_updated_at();

-- Grants
GRANT SELECT ON public.gift_codes TO authenticated;
GRANT ALL ON public.gift_codes TO service_role;

-- Comments
COMMENT ON TABLE public.gift_codes IS 'Gift subscription purchases and redemptions';
COMMENT ON COLUMN public.gift_codes.code IS '16-character gift code with dashes (GIFT-XXXX-XXXX-XXXX)';
COMMENT ON COLUMN public.gift_codes.status IS 'pending=awaiting payment, active=ready for redemption, redeemed=used, expired=past expiry, refunded=refunded';
COMMENT ON COLUMN public.gift_codes.expires_at IS 'Gift codes expire 1 year from purchase date';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_fm_cols TEXT;
  v_stripe_exists BOOLEAN;
  v_gift_exists BOOLEAN;
BEGIN
  -- Check family_members columns
  SELECT string_agg(column_name, ', ') INTO v_fm_cols
  FROM information_schema.columns
  WHERE table_name = 'family_members'
    AND table_schema = 'public'
    AND column_name IN ('last_story_notification_sent_at', 'email_notifications');

  RAISE NOTICE 'family_members notification columns: %', COALESCE(v_fm_cols, 'NONE');

  -- Check stripe_customers table
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'stripe_customers' AND schemaname = 'public') INTO v_stripe_exists;
  RAISE NOTICE 'stripe_customers table exists: %', v_stripe_exists;

  -- Check gift_codes table
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'gift_codes' AND schemaname = 'public') INTO v_gift_exists;
  RAISE NOTICE 'gift_codes table exists: %', v_gift_exists;
END $$;
