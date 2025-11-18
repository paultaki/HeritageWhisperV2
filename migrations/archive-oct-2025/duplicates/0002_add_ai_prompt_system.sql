-- Migration: Add AI Prompt Generation System
-- Created: 2025-10-09
-- Description: Adds tables and columns for personalized prompt generation, 
--              lesson extraction, and character evolution tracking

-- ============================================================================
-- PART 1: ADD COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add AI Prompt System columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS free_stories_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS last_tier2_attempt TIMESTAMP,
ADD COLUMN IF NOT EXISTS do_not_ask JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_t3_ran_at TIMESTAMP;

-- Add constraint for subscription_status values
ALTER TABLE users 
ADD CONSTRAINT users_subscription_status_check 
CHECK (subscription_status IN ('none', 'active', 'cancelled', 'expired'));

-- Add AI Prompt System columns to stories table
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS lesson_learned TEXT,
ADD COLUMN IF NOT EXISTS lesson_alternatives JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS character_insights JSONB,
ADD COLUMN IF NOT EXISTS source_prompt_id UUID,
ADD COLUMN IF NOT EXISTS life_phase TEXT;

-- Add constraint for life_phase values
ALTER TABLE stories
ADD CONSTRAINT stories_life_phase_check
CHECK (life_phase IN ('childhood', 'teen', 'early_adult', 'mid_adult', 'late_adult', 'senior'));

-- ============================================================================
-- PART 2: CREATE NEW TABLES
-- ============================================================================

-- Active prompts table - stores currently active prompts (1-5 per user at any time)
CREATE TABLE IF NOT EXISTS active_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Prompt content
  prompt_text TEXT NOT NULL,
  context_note TEXT,
  
  -- Deduplication & anchoring
  anchor_entity TEXT,
  anchor_year INTEGER,
  anchor_hash TEXT NOT NULL,
  
  -- Tier & quality
  tier INTEGER NOT NULL,
  memory_type TEXT,
  prompt_score INTEGER,
  score_reason TEXT,
  model_version TEXT DEFAULT 'gpt-4o',
  
  -- Lifecycle
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_locked BOOLEAN DEFAULT false,
  
  -- Engagement tracking
  shown_count INTEGER DEFAULT 0,
  last_shown_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT active_prompts_unique_anchor UNIQUE(user_id, anchor_hash),
  CONSTRAINT active_prompts_tier_check CHECK (tier >= 0 AND tier <= 3),
  CONSTRAINT active_prompts_score_check CHECK (prompt_score IS NULL OR (prompt_score >= 0 AND prompt_score <= 100))
);

-- Prompt history table - archives used/skipped/expired prompts for analytics
CREATE TABLE IF NOT EXISTS prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Original prompt data
  prompt_text TEXT NOT NULL,
  anchor_hash TEXT,
  anchor_entity TEXT,
  anchor_year INTEGER,
  tier INTEGER,
  memory_type TEXT,
  prompt_score INTEGER,
  
  -- Outcome tracking
  shown_count INTEGER,
  outcome TEXT NOT NULL,
  story_id UUID REFERENCES stories(id),
  
  -- Timestamps
  created_at TIMESTAMP,
  resolved_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT prompt_history_outcome_check CHECK (outcome IN ('used', 'skipped', 'expired'))
);

-- Character evolution table - tracks character development across stories
CREATE TABLE IF NOT EXISTS character_evolution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_count INTEGER NOT NULL,
  
  -- Character analysis
  traits JSONB,
  invisible_rules JSONB,
  contradictions JSONB,
  
  -- Metadata
  analyzed_at TIMESTAMP DEFAULT NOW(),
  model_version TEXT DEFAULT 'gpt-4o',
  
  -- Constraints
  CONSTRAINT character_evolution_unique_count UNIQUE(user_id, story_count)
);

-- ============================================================================
-- PART 3: CREATE INDEXES
-- ============================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_free_stories_used ON users(free_stories_used);

-- Stories table indexes
CREATE INDEX IF NOT EXISTS idx_stories_source_prompt ON stories(source_prompt_id) WHERE source_prompt_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stories_life_phase ON stories(life_phase);
CREATE INDEX IF NOT EXISTS idx_stories_lesson_learned ON stories(user_id) WHERE lesson_learned IS NOT NULL;

-- Active prompts indexes
CREATE INDEX IF NOT EXISTS idx_active_prompts_user ON active_prompts(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_active_prompts_tier ON active_prompts(tier, prompt_score DESC);
CREATE INDEX IF NOT EXISTS idx_active_prompts_locked ON active_prompts(user_id, is_locked);
CREATE INDEX IF NOT EXISTS idx_active_prompts_expires ON active_prompts(expires_at);

-- Prompt history indexes
CREATE INDEX IF NOT EXISTS idx_prompt_history_user ON prompt_history(user_id, resolved_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_history_outcome ON prompt_history(user_id, outcome, tier);
CREATE INDEX IF NOT EXISTS idx_prompt_history_story ON prompt_history(story_id) WHERE story_id IS NOT NULL;

-- Character evolution indexes
CREATE INDEX IF NOT EXISTS idx_character_evolution_user ON character_evolution(user_id, story_count DESC);

-- ============================================================================
-- PART 4: CREATE CLEANUP FUNCTION
-- ============================================================================

-- Function to archive expired prompts and clean up old history
CREATE OR REPLACE FUNCTION archive_expired_prompts() RETURNS void AS $$
BEGIN
  -- Move expired prompts to history
  INSERT INTO prompt_history (
    user_id, prompt_text, anchor_hash, anchor_entity, anchor_year,
    tier, memory_type, prompt_score, shown_count, outcome, created_at
  )
  SELECT 
    user_id, prompt_text, anchor_hash, anchor_entity, anchor_year,
    tier, memory_type, prompt_score, shown_count, 'expired', created_at
  FROM active_prompts
  WHERE expires_at < NOW() AND is_locked = false;
  
  -- Delete expired prompts
  DELETE FROM active_prompts 
  WHERE expires_at < NOW() AND is_locked = false;
  
  -- Delete old history (keep 1 year)
  DELETE FROM prompt_history 
  WHERE resolved_at < NOW() - INTERVAL '365 days';
  
  RAISE NOTICE 'Archived and cleaned up expired prompts';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 5: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

-- Users table comments
COMMENT ON COLUMN users.free_stories_used IS 'Number of free stories used (0-3)';
COMMENT ON COLUMN users.subscription_status IS 'Subscription status: none, active, cancelled, expired';
COMMENT ON COLUMN users.last_tier2_attempt IS 'Last time Tier 2 on-demand prompt generation was attempted (rate limited to 1 per 24h)';
COMMENT ON COLUMN users.do_not_ask IS 'Array of topics user does not want to be prompted about';
COMMENT ON COLUMN users.onboarding_t3_ran_at IS 'Timestamp when Story 1/2/3 Tier 3 analysis was completed';

-- Stories table comments
COMMENT ON COLUMN stories.lesson_learned IS 'The lesson or wisdom extracted from this story (selected from alternatives)';
COMMENT ON COLUMN stories.lesson_alternatives IS 'Alternative lesson suggestions generated by AI';
COMMENT ON COLUMN stories.character_insights IS 'Character analysis data from milestone processing';
COMMENT ON COLUMN stories.source_prompt_id IS 'ID of the prompt that generated this story (if applicable)';
COMMENT ON COLUMN stories.life_phase IS 'Life phase when story occurred: childhood, teen, early_adult, mid_adult, late_adult, senior';

-- Active prompts table comments
COMMENT ON TABLE active_prompts IS 'Currently active prompts shown to users (1-5 per user at any time)';
COMMENT ON COLUMN active_prompts.prompt_text IS 'The actual prompt text shown to the user';
COMMENT ON COLUMN active_prompts.context_note IS 'Context shown with prompt (e.g., "Based on your 1955 story")';
COMMENT ON COLUMN active_prompts.anchor_entity IS 'Key entity this prompt references (person, place, object)';
COMMENT ON COLUMN active_prompts.anchor_year IS 'Year this prompt references (NULL if not year-specific)';
COMMENT ON COLUMN active_prompts.anchor_hash IS 'SHA1 hash for deduplication: sha1(type|entity|year)';
COMMENT ON COLUMN active_prompts.tier IS 'Prompt generation tier: 0=fallback, 1=template, 2=on-demand, 3=milestone';
COMMENT ON COLUMN active_prompts.memory_type IS 'Type of memory prompt: person_expansion, object_origin, decade_gap, etc.';
COMMENT ON COLUMN active_prompts.prompt_score IS 'Recording likelihood score from GPT-4o (0-100)';
COMMENT ON COLUMN active_prompts.score_reason IS 'One-sentence explanation for the score (for audit)';
COMMENT ON COLUMN active_prompts.expires_at IS 'When this prompt expires and should be archived';
COMMENT ON COLUMN active_prompts.is_locked IS 'If true, prompt is hidden until user pays (premium seed)';
COMMENT ON COLUMN active_prompts.shown_count IS 'Number of times this prompt has been shown to user';

-- Prompt history table comments
COMMENT ON TABLE prompt_history IS 'Archive of used, skipped, or expired prompts for analytics';
COMMENT ON COLUMN prompt_history.outcome IS 'How the prompt was resolved: used, skipped, expired';
COMMENT ON COLUMN prompt_history.story_id IS 'ID of story created from this prompt (NULL if skipped/expired)';

-- Character evolution table comments
COMMENT ON TABLE character_evolution IS 'Character development tracked across milestone story counts';
COMMENT ON COLUMN character_evolution.story_count IS 'Number of stories when this analysis was performed';
COMMENT ON COLUMN character_evolution.traits IS 'Array of character traits with confidence scores and evidence';
COMMENT ON COLUMN character_evolution.invisible_rules IS 'Unspoken principles and rules the person lives by';
COMMENT ON COLUMN character_evolution.contradictions IS 'Tensions between stated values and lived behaviors';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
