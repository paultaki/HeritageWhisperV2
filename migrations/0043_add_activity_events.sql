-- Migration: Add activity_events table for tracking user and family interactions
-- Created: 2025-01-14
-- Purpose: Track key events (story listening, recording, family joins, invites) for Recent Activity feed

CREATE TABLE IF NOT EXISTS public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  family_member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL,
  story_id uuid REFERENCES public.stories(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'story_listened',
    'story_recorded',
    'family_member_joined',
    'invite_sent',
    'invite_resent'
  )),
  metadata jsonb DEFAULT '{}',
  occurred_at timestamptz DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_events_user_id_occurred_at
  ON public.activity_events(user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_events_event_type
  ON public.activity_events(event_type);

CREATE INDEX IF NOT EXISTS idx_activity_events_actor_id
  ON public.activity_events(actor_id);

CREATE INDEX IF NOT EXISTS idx_activity_events_story_id
  ON public.activity_events(story_id) WHERE story_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own activity events
CREATE POLICY "Users can read their own activity events"
  ON public.activity_events
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    -- Family members can see storyteller's activity if they have access
    EXISTS (
      SELECT 1
      FROM public.family_collaborations fc
      WHERE fc.storyteller_user_id = activity_events.user_id
        AND fc.storyteller_user_id IN (
          SELECT storyteller_user_id
          FROM public.family_collaborations
          WHERE storyteller_user_id = auth.uid()
        )
        AND fc.status = 'active'
    )
  );

-- RLS Policy: Service role can insert events (API routes)
CREATE POLICY "Service role can insert activity events"
  ON public.activity_events
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Users can insert their own events
CREATE POLICY "Users can insert their own activity events"
  ON public.activity_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT ON public.activity_events TO authenticated;
GRANT ALL ON public.activity_events TO service_role;

-- Documentation
COMMENT ON TABLE public.activity_events IS 'Tracks key user and family interactions for the Recent Activity feed. Events include story listening, recording, family member joins, and invites.';
COMMENT ON COLUMN public.activity_events.user_id IS 'Owner of the family circle (storyteller) - the person whose activity feed this event appears in';
COMMENT ON COLUMN public.activity_events.actor_id IS 'The user who performed the action (nullable, may be same as user_id)';
COMMENT ON COLUMN public.activity_events.event_type IS 'Type of activity: story_listened, story_recorded, family_member_joined, invite_sent, invite_resent';
COMMENT ON COLUMN public.activity_events.metadata IS 'Additional structured data (e.g., {"times_listened": 1, "duration_seconds": 45})';
