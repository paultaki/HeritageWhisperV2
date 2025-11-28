-- Migration: Create gift_codes table for gift subscription system
-- Purpose: Track gift subscription purchases and redemptions
-- Date: 2025-11-28

-- Create the gift_codes table
CREATE TABLE IF NOT EXISTS public.gift_codes (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Gift code (format: GIFT-XXXX-XXXX-XXXX, 16 chars with dashes)
  code TEXT NOT NULL UNIQUE,

  -- Purchase info
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_paid_cents INTEGER NOT NULL DEFAULT 7900,

  -- Purchaser info
  purchaser_email TEXT NOT NULL,
  purchaser_name TEXT,
  purchaser_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Recipient info (filled in on redemption, not purchase)
  recipient_email TEXT,
  recipient_name TEXT,

  -- Redemption tracking
  redeemed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ,

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'redeemed', 'expired', 'refunded')),
  expires_at TIMESTAMPTZ NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gift_codes_code ON public.gift_codes(code);
CREATE INDEX IF NOT EXISTS idx_gift_codes_status ON public.gift_codes(status);
CREATE INDEX IF NOT EXISTS idx_gift_codes_purchaser_email ON public.gift_codes(purchaser_email);
CREATE INDEX IF NOT EXISTS idx_gift_codes_purchaser_user_id ON public.gift_codes(purchaser_user_id);
CREATE INDEX IF NOT EXISTS idx_gift_codes_redeemed_by_user_id ON public.gift_codes(redeemed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_gift_codes_expires_at ON public.gift_codes(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_gift_codes_stripe_session ON public.gift_codes(stripe_checkout_session_id);

-- Enable Row Level Security
ALTER TABLE public.gift_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Purchasers can view their own purchased gifts
CREATE POLICY "Purchasers can view their own gifts"
  ON public.gift_codes
  FOR SELECT
  USING (
    purchaser_user_id = (SELECT auth.uid())
    OR purchaser_email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
  );

-- Recipients can view gifts they've redeemed
CREATE POLICY "Recipients can view their redeemed gifts"
  ON public.gift_codes
  FOR SELECT
  USING (redeemed_by_user_id = (SELECT auth.uid()));

-- Service role has full access (for API operations and webhooks)
CREATE POLICY "Service role full access on gift_codes"
  ON public.gift_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_gift_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gift_codes_updated_at
  BEFORE UPDATE ON public.gift_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gift_codes_updated_at();

-- Grant permissions
GRANT SELECT ON public.gift_codes TO authenticated;
GRANT ALL ON public.gift_codes TO service_role;

-- Documentation comments
COMMENT ON TABLE public.gift_codes IS 'Gift subscription purchases and redemptions';
COMMENT ON COLUMN public.gift_codes.code IS '16-character gift code with dashes (GIFT-XXXX-XXXX-XXXX)';
COMMENT ON COLUMN public.gift_codes.status IS 'pending=awaiting payment, active=ready for redemption, redeemed=used, expired=past expiry, refunded=refunded';
COMMENT ON COLUMN public.gift_codes.expires_at IS 'Gift codes expire 1 year from purchase date';
