-- Migration: Add support for review drafts to interview_drafts table
-- Purpose: Allow users to save their progress on the review screen and resume later
-- Date: December 13, 2025

-- 1. Add interview_id column to link review drafts to interviews
ALTER TABLE interview_drafts
ADD COLUMN IF NOT EXISTS interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE;

-- 2. Add draft_type column to differentiate between interview and review drafts
ALTER TABLE interview_drafts
ADD COLUMN IF NOT EXISTS draft_type TEXT NOT NULL DEFAULT 'interview';

-- 3. Add review_data column to store review screen state (story edits, photos, etc.)
ALTER TABLE interview_drafts
ADD COLUMN IF NOT EXISTS review_data JSONB;

-- 4. Create index on interview_id for faster lookups
CREATE INDEX IF NOT EXISTS interview_drafts_interview_id_idx ON interview_drafts(interview_id);

-- 5. Create index on draft_type for filtering
CREATE INDEX IF NOT EXISTS interview_drafts_draft_type_idx ON interview_drafts(draft_type);

-- 6. Add composite index for user_id + draft_type + interview_id lookups
CREATE INDEX IF NOT EXISTS interview_drafts_user_draft_type_interview_idx
ON interview_drafts(user_id, draft_type, interview_id);

-- 7. Add check constraint to ensure draft_type is either 'interview' or 'review'
ALTER TABLE interview_drafts
ADD CONSTRAINT IF NOT EXISTS interview_drafts_draft_type_check
CHECK (draft_type IN ('interview', 'review'));

-- 8. Add constraint: review drafts must have interview_id
-- (interview drafts can have null interview_id)
ALTER TABLE interview_drafts
ADD CONSTRAINT IF NOT EXISTS interview_drafts_review_requires_interview
CHECK (
  (draft_type = 'review' AND interview_id IS NOT NULL) OR
  (draft_type = 'interview')
);

-- Add helpful comments
COMMENT ON COLUMN interview_drafts.interview_id IS 'Links review drafts to their corresponding interview record';
COMMENT ON COLUMN interview_drafts.draft_type IS 'Type of draft: interview (in-progress recording) or review (uncompleted review screen)';
COMMENT ON COLUMN interview_drafts.review_data IS 'Stores review screen state (storyEdits, saveAsFullInterview, fullInterviewTitle)';

-- ========================================
-- HOW TO RUN THIS MIGRATION
-- ========================================
--
-- 1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/pwuzksomxnbdndeeivzf
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New query"
-- 4. Copy and paste this entire file
-- 5. Click "Run" or press Cmd+Enter
-- 6. Verify success message
--
-- OR run via Supabase CLI:
-- npx supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.pwuzksomxnbdndeeivzf.supabase.co:5432/postgres"
