# Supabase Database Setup - Fixed Version

## Instructions
1. Go to your Supabase SQL Editor: https://supabase.com/dashboard/project/tjycibrhoammxohemyhq/sql/new
2. Copy ALL the SQL below
3. Paste it into the SQL editor
4. Click "Run" to execute

## Fixed SQL Script

```sql
-- First, drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  name TEXT NOT NULL DEFAULT 'User',
  birth_year INTEGER NOT NULL DEFAULT 1950,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create stories table with underscores (matching the schema.ts)
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  audio_url TEXT,
  transcription TEXT,
  duration_seconds INTEGER DEFAULT 0,
  wisdom_clip_url TEXT,
  wisdom_clip_text TEXT,
  wisdom_clip_duration INTEGER,
  story_year INTEGER NOT NULL,
  story_date TIMESTAMP,
  life_age INTEGER,
  photo_url TEXT,
  photo_transform JSONB,
  photos JSONB,
  emotions JSONB,
  pivotal_category TEXT,
  include_in_book BOOLEAN DEFAULT true,
  include_in_timeline BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,
  formatted_content TEXT,
  extracted_facts JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_story_year ON stories(story_year);
CREATE INDEX idx_users_email ON users(email);

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policies for stories table
CREATE POLICY "Users can view their own stories" ON stories
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own stories" ON stories
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own stories" ON stories
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own stories" ON stories
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Insert your user account
INSERT INTO users (id, email, name, birth_year)
VALUES ('38ad3036-e423-4e41-a3f3-020664a1ee0e', 'hello@heritagewhisper.com', 'User', 1950)
ON CONFLICT (id) DO NOTHING;
```

## What's Different
- This version will DROP existing tables first (if any) to ensure a clean setup
- All column names use underscores (story_year, user_id, etc.) to match your code
- Creates everything fresh

## Warning
This will DELETE any existing data in the users and stories tables. Since you're starting fresh, this should be fine.

## After Running
Once this runs successfully, your app should work!