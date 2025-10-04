-- Initial Schema Setup for HeritageWhisper V2
-- This creates all tables defined in shared/schema.ts
-- Run this FIRST before any other migrations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (links to Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  name TEXT NOT NULL DEFAULT 'User',
  birth_year INTEGER NOT NULL,
  bio TEXT,
  profile_photo_url TEXT,
  story_count INTEGER DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  latest_terms_version TEXT,
  latest_privacy_version TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  audio_url TEXT,
  transcription TEXT,
  duration_seconds INTEGER,
  wisdom_clip_url TEXT,
  wisdom_clip_text TEXT,
  wisdom_clip_duration INTEGER,
  story_year INTEGER,
  story_date TIMESTAMP,
  life_age INTEGER,
  photo_url TEXT,
  photo_transform JSONB,
  photos JSONB,
  emotions JSONB,
  pivotal_category TEXT,
  include_in_book BOOLEAN DEFAULT true NOT NULL,
  include_in_timeline BOOLEAN DEFAULT true NOT NULL,
  is_favorite BOOLEAN DEFAULT false NOT NULL,
  formatted_content JSONB,
  extracted_facts JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Follow-ups table
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  was_answered BOOLEAN DEFAULT false
);

-- Ghost prompts table
CREATE TABLE IF NOT EXISTS ghost_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  prompt_title TEXT NOT NULL,
  category TEXT NOT NULL,
  decade TEXT NOT NULL,
  age_range TEXT NOT NULL,
  is_generated BOOLEAN DEFAULT false,
  based_on_story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Historical context table
CREATE TABLE IF NOT EXISTS historical_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  decade TEXT NOT NULL,
  age_range TEXT NOT NULL,
  facts JSONB NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  birth_year INTEGER NOT NULL,
  major_life_phases JSONB,
  work_ethic INTEGER,
  risk_tolerance INTEGER,
  family_orientation INTEGER,
  spirituality INTEGER,
  preferred_style TEXT CHECK (preferred_style IN ('direct', 'gentle', 'curious', 'reflective')),
  emotional_comfort INTEGER,
  detail_level TEXT CHECK (detail_level IN ('brief', 'moderate', 'detailed')),
  follow_up_frequency TEXT CHECK (follow_up_frequency IN ('minimal', 'occasional', 'frequent')),
  completion_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Demo stories table
CREATE TABLE IF NOT EXISTS demo_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  audio_url TEXT,
  transcription TEXT,
  duration_seconds INTEGER,
  wisdom_clip_url TEXT,
  wisdom_clip_text TEXT,
  wisdom_clip_duration INTEGER,
  story_year INTEGER,
  story_date TIMESTAMP,
  life_age INTEGER,
  photo_url TEXT,
  photo_transform JSONB,
  photos JSONB,
  emotions JSONB,
  pivotal_category TEXT,
  include_in_book BOOLEAN DEFAULT true NOT NULL,
  include_in_timeline BOOLEAN DEFAULT true NOT NULL,
  is_favorite BOOLEAN DEFAULT false NOT NULL,
  formatted_content JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  is_original BOOLEAN DEFAULT true,
  public_audio_url TEXT,
  public_photo_url TEXT
);

-- Family members table
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  relationship TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  invited_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  last_viewed_at TIMESTAMP,
  custom_message TEXT,
  permissions JSONB DEFAULT '{"canView": true, "canComment": true, "canDownload": false}'::jsonb
);

-- Family activity table
CREATE TABLE IF NOT EXISTS family_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Shared access table
CREATE TABLE IF NOT EXISTS shared_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL DEFAULT 'view',
  share_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true NOT NULL,
  last_accessed_at TIMESTAMP
);

-- User agreements table
CREATE TABLE IF NOT EXISTS user_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agreement_type TEXT NOT NULL CHECK (agreement_type IN ('terms', 'privacy')),
  version TEXT NOT NULL,
  accepted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  method TEXT NOT NULL DEFAULT 'signup' CHECK (method IN ('signup', 'reacceptance', 'oauth'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_story_year ON stories(story_year);
CREATE INDEX IF NOT EXISTS idx_follow_ups_story_id ON follow_ups(story_id);
CREATE INDEX IF NOT EXISTS idx_ghost_prompts_user_id ON ghost_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_historical_context_user_id ON historical_context(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_activity_user_id ON family_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_access_owner ON shared_access(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_access_token ON shared_access(share_token);
CREATE INDEX IF NOT EXISTS idx_user_agreements_user_id ON user_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agreements_type_version ON user_agreements(agreement_type, version);
CREATE INDEX IF NOT EXISTS idx_user_agreements_accepted_at ON user_agreements(accepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_agreements_user_type ON user_agreements(user_id, agreement_type);

-- Add helpful comments
COMMENT ON TABLE users IS 'User accounts linked to Supabase auth.users';
COMMENT ON TABLE stories IS 'User-created life stories with audio, photos, and AI-generated content';
COMMENT ON TABLE user_agreements IS 'Tracks user acceptance of Terms of Service and Privacy Policy with version history';
COMMENT ON COLUMN user_agreements.agreement_type IS 'Type of agreement: terms or privacy';
COMMENT ON COLUMN user_agreements.version IS 'Version number of the agreement (e.g., 1.0, 1.1, 2.0)';
COMMENT ON COLUMN user_agreements.method IS 'How the agreement was accepted: signup, reacceptance, or oauth';
COMMENT ON COLUMN users.latest_terms_version IS 'Most recent Terms of Service version accepted by user';
COMMENT ON COLUMN users.latest_privacy_version IS 'Most recent Privacy Policy version accepted by user';
