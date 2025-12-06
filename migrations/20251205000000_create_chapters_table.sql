-- Create chapters table for organizing stories into book chapters
-- Family access is handled at the API level (uses supabaseAdmin which bypasses RLS)

CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  intro_text TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chapters_user_id ON chapters(user_id);
CREATE INDEX IF NOT EXISTS idx_chapters_user_order ON chapters(user_id, order_index);

-- Enable RLS
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- User policies (family access handled by API route with supabaseAdmin)
CREATE POLICY "Users can view own chapters"
  ON chapters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chapters"
  ON chapters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chapters"
  ON chapters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chapters"
  ON chapters FOR DELETE
  USING (auth.uid() = user_id);

-- Add chapter columns to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS chapter_order_index INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_stories_chapter_id ON stories(chapter_id);
