-- Create chapters table for organizing stories into book chapters
-- This enables the book view to group stories by chapter

CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  intro_text TEXT,  -- Optional AI-generated chapter intro
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_chapters_user_id ON chapters(user_id);

-- Index for ordering chapters
CREATE INDEX IF NOT EXISTS idx_chapters_user_order ON chapters(user_id, order_index);

-- Enable Row Level Security
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own chapters
CREATE POLICY "Users can view own chapters"
  ON chapters FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own chapters
CREATE POLICY "Users can insert own chapters"
  ON chapters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own chapters
CREATE POLICY "Users can update own chapters"
  ON chapters FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own chapters
CREATE POLICY "Users can delete own chapters"
  ON chapters FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policy: Family members can view chapters (read-only)
CREATE POLICY "Family members can view chapters"
  ON chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.storyteller_id = chapters.user_id
        AND family_members.member_id = (SELECT auth.uid())
        AND family_members.status = 'active'
    )
  );

-- Add chapter_id column to stories table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'chapter_id'
  ) THEN
    ALTER TABLE stories ADD COLUMN chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add chapter_order_index to stories for ordering within a chapter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'chapter_order_index'
  ) THEN
    ALTER TABLE stories ADD COLUMN chapter_order_index INTEGER DEFAULT 0;
  END IF;
END $$;

-- Index for finding stories by chapter
CREATE INDEX IF NOT EXISTS idx_stories_chapter_id ON stories(chapter_id);
