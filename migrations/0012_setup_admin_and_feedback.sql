-- Migration: Setup admin role and prompt_feedback table
-- Created: 2025-01-03
-- Purpose: Enable admin functionality and prompt feedback system

-- 1. Ensure prompt_feedback table exists with all required columns
CREATE TABLE IF NOT EXISTS prompt_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES active_prompts(id),
  prompt_text TEXT NOT NULL,
  story_id UUID REFERENCES stories(id),
  story_excerpt TEXT,
  rating TEXT NOT NULL CHECK (rating IN ('good', 'bad', 'excellent', 'terrible')),
  feedback_notes TEXT,
  tags TEXT[],
  prompt_tier INTEGER,
  prompt_type TEXT,
  anchor_entity TEXT,
  word_count INTEGER,
  prompt_score REAL,
  quality_report JSONB,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index on reviewed_at for performance
CREATE INDEX IF NOT EXISTS idx_prompt_feedback_reviewed_at
  ON prompt_feedback(reviewed_at DESC);

-- 3. Create index on rating for filtering
CREATE INDEX IF NOT EXISTS idx_prompt_feedback_rating
  ON prompt_feedback(rating);

-- 4. Create index on prompt_tier for filtering
CREATE INDEX IF NOT EXISTS idx_prompt_feedback_tier
  ON prompt_feedback(prompt_tier);

-- 5. Enable RLS on prompt_feedback
ALTER TABLE prompt_feedback ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policy for admins only
CREATE POLICY "Admins can view all feedback"
  ON prompt_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert feedback"
  ON prompt_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- 7. Set your user as admin (update with your actual email)
-- IMPORTANT: Update this email to match your account
UPDATE users
SET role = 'admin'
WHERE email = 'paul@heritagewhisper.com';

-- If your email is different, uncomment and use this:
-- UPDATE users
-- SET role = 'admin'
-- WHERE email = 'your-email@example.com';

-- 8. Verify admin setup
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'admin';
  RAISE NOTICE 'Admin users found: %', admin_count;

  IF admin_count = 0 THEN
    RAISE WARNING 'No admin users found! Please update the email in this migration.';
  END IF;
END $$;
