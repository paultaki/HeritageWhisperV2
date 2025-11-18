-- Prompt Quality Feedback System
-- Allows admins to rate prompts as good/bad and collect training data

-- Table: prompt_feedback
-- Stores human feedback on prompt quality for model refinement
CREATE TABLE IF NOT EXISTS prompt_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to the prompt being rated
  prompt_id UUID REFERENCES active_prompts(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,

  -- The story that generated this prompt
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  story_excerpt TEXT, -- First 200 chars of story for context

  -- Feedback
  rating TEXT NOT NULL CHECK (rating IN ('good', 'bad', 'excellent', 'terrible')),
  feedback_notes TEXT, -- Why is this good/bad?
  tags TEXT[], -- e.g., ['generic', 'no-context', 'body-part', 'placeholder-response']

  -- Metadata for analysis
  prompt_tier INTEGER, -- 1, 3, or echo
  prompt_type TEXT, -- person_expansion, place_memory, object_as_bridge, etc.
  anchor_entity TEXT, -- What entity was used
  word_count INTEGER,
  prompt_score DECIMAL(5,2), -- Original quality score

  -- Quality gate results at generation time
  quality_report JSONB, -- Full quality report from getQualityReport()

  -- Reviewer info
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_prompt_feedback_rating ON prompt_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_prompt_feedback_tier ON prompt_feedback(prompt_tier);
CREATE INDEX IF NOT EXISTS idx_prompt_feedback_type ON prompt_feedback(prompt_type);
CREATE INDEX IF NOT EXISTS idx_prompt_feedback_reviewed_at ON prompt_feedback(reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_feedback_tags ON prompt_feedback USING GIN(tags);

-- Row Level Security
ALTER TABLE prompt_feedback ENABLE ROW LEVEL SECURITY;

-- Only admins can view/insert/update feedback
CREATE POLICY "Admin full access to prompt_feedback"
  ON prompt_feedback
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_prompt_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prompt_feedback_updated_at
  BEFORE UPDATE ON prompt_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_feedback_updated_at();

-- View: prompt_quality_stats
-- Aggregated stats for dashboard
CREATE OR REPLACE VIEW prompt_quality_stats AS
SELECT
  rating,
  prompt_tier,
  prompt_type,
  COUNT(*) as count,
  AVG(prompt_score) as avg_score,
  AVG(word_count) as avg_words,
  ARRAY_AGG(DISTINCT tags) FILTER (WHERE tags IS NOT NULL) as common_tags
FROM prompt_feedback
GROUP BY rating, prompt_tier, prompt_type;

COMMENT ON TABLE prompt_feedback IS 'Human feedback on AI-generated prompts for quality improvement and model training';
COMMENT ON VIEW prompt_quality_stats IS 'Aggregated prompt quality statistics for dashboard';
