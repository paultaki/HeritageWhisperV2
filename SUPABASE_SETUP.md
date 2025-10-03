# Supabase Database Setup for HeritageWhisper

## Instructions
1. Go to your Supabase SQL Editor: https://supabase.com/dashboard/project/tjycibrhoammxohemyhq/sql/new
2. Copy ALL the SQL below (everything between the triple backticks)
3. Paste it into the SQL editor
4. Click "Run" to execute

## Full SQL Script

```sql
-- Create tables for HeritageWhisper in Supabase

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  name TEXT NOT NULL DEFAULT 'User',
  birth_year INTEGER NOT NULL DEFAULT 1950,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
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
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_story_year ON stories(story_year);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

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

-- Insert initial user for testing (your Supabase auth user)
-- This will allow the foreign key constraint to work
INSERT INTO users (id, email, name, birth_year)
VALUES ('38ad3036-e423-4e41-a3f3-020664a1ee0e', 'hello@heritagewhisper.com', 'User', 1950)
ON CONFLICT (id) DO NOTHING;
```

## What This Does
- Creates a `users` table for storing user accounts
- Creates a `stories` table for storing all story content
- Sets up indexes for fast queries
- Enables Row Level Security so users can only see their own data
- Creates your user account so you can start saving stories

## After Running
Once you run this SQL successfully, go back to your app and try saving a story. It should work!