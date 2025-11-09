-- Migration: Add paywall_events table for tracking upgrade funnel
-- Created: 2025-01-08
-- Purpose: Track user interactions with paywall modals and upgrade flow

-- Create paywall_events table
CREATE TABLE IF NOT EXISTS public.paywall_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'modal_shown',
    'upgrade_clicked',
    'modal_dismissed',
    'checkout_started',
    'checkout_completed',
    'checkout_failed'
  )),
  trigger_location text NOT NULL CHECK (trigger_location IN (
    'family_invite',
    'profile_page',
    'banner_timeline',
    'banner_book',
    'banner_memory_box',
    'direct_link'
  )),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Add index for user lookups
CREATE INDEX IF NOT EXISTS idx_paywall_events_user_id
  ON public.paywall_events(user_id);

-- Add index for event type analytics
CREATE INDEX IF NOT EXISTS idx_paywall_events_type
  ON public.paywall_events(event_type);

-- Add index for time-based queries
CREATE INDEX IF NOT EXISTS idx_paywall_events_created_at
  ON public.paywall_events(created_at DESC);

-- Add composite index for funnel analysis
CREATE INDEX IF NOT EXISTS idx_paywall_events_user_type_created
  ON public.paywall_events(user_id, event_type, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.paywall_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own events
CREATE POLICY "Users can read their own paywall events"
  ON public.paywall_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can insert events (API routes)
CREATE POLICY "Service role can insert paywall events"
  ON public.paywall_events
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Admins can read all events (for analytics)
CREATE POLICY "Admins can read all paywall events"
  ON public.paywall_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT, INSERT ON public.paywall_events TO authenticated;
GRANT ALL ON public.paywall_events TO service_role;

-- Add comment for documentation
COMMENT ON TABLE public.paywall_events IS 'Tracks user interactions with paywall modals and upgrade flow for conversion analytics';
COMMENT ON COLUMN public.paywall_events.event_type IS 'Type of event: modal_shown, upgrade_clicked, modal_dismissed, checkout_started, checkout_completed, checkout_failed';
COMMENT ON COLUMN public.paywall_events.trigger_location IS 'Where the event was triggered: family_invite, profile_page, banner_*';
COMMENT ON COLUMN public.paywall_events.metadata IS 'Additional context (plan selected, price, error messages, etc.)';
