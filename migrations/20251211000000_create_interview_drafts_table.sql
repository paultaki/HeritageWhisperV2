-- Create interview_drafts table for auto-saving interview progress
-- Prevents data loss if browser crashes or user accidentally navigates away
-- Drafts are automatically deleted after successful story save or 24-hour expiration

CREATE TABLE IF NOT EXISTS interview_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transcript_json JSONB NOT NULL DEFAULT '[]',
  theme TEXT,
  session_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user lookup (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_interview_drafts_user_id ON interview_drafts(user_id);

-- Index for cleanup queries (find stale drafts)
CREATE INDEX IF NOT EXISTS idx_interview_drafts_updated_at ON interview_drafts(updated_at);

-- Enable RLS
ALTER TABLE interview_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only access their own drafts
CREATE POLICY "Users can view own interview drafts"
  ON interview_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interview drafts"
  ON interview_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interview drafts"
  ON interview_drafts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interview drafts"
  ON interview_drafts FOR DELETE
  USING (auth.uid() = user_id);

-- Comment for documentation
COMMENT ON TABLE interview_drafts IS 'Auto-save drafts for Pearl Interview sessions. Prevents data loss on browser crash. Cleaned up after 24 hours.';
COMMENT ON COLUMN interview_drafts.transcript_json IS 'JSON array of message objects with id, type, content, timestamp, sender';
COMMENT ON COLUMN interview_drafts.theme IS 'Interview theme ID (e.g., childhood, career, family)';
COMMENT ON COLUMN interview_drafts.session_duration IS 'Duration in seconds at time of last save';
