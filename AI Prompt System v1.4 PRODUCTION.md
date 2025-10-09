HeritageWhisper AI Prompt Generation & Story Analysis System
Technical Specification v1.3 - Production Ready Last Updated: October 2025 Owner: Paul Takisaki Purpose: Complete implementation guide for AI-powered memory prompt and lesson extraction system Status: Ready for Development
TABLE OF CONTENTS
Product Context & Business Goals
System Architecture Overview
User Flows
Database Schema
API Specifications
AI Prompt Templates
Business Logic & Algorithms
Edge Cases & Fallbacks
Safety & Compliance
Metrics & Success Criteria
Cost Model & Budget
Implementation Checklist
1. PRODUCT CONTEXT & BUSINESS GOALS
1.1 The Problems
Prompt Generation: Seniors struggle to remember what stories to tell. Generic prompts fail to trigger forgotten memories.
Lesson Extraction: Stories lack the crystallized wisdom that makes them valuable to pass down.
1.2 The Solutions
AI Prompts: AI analyzes existing stories to generate personalized prompts that reference what they already shared.
Lesson Learning: Every story gets 2-3 AI-suggested lessons they can edit, making them look wise and articulate.
1.3 The Differentiation
StoryWorth: Generic list of 500 prompts (same for everyone)
HeritageWhisper: "You mentioned your father's workshop in 1955. Who else spent time there with you?"
Plus: Every story ends with a meaningful lesson learned in their voice
1.4 Business Objectives
Free Tier (Stories 1-3):
Goal: Convert trial users to paid subscribers
Strategy: Show AI "magic" at Stories 1, 2, and 3
Target: 45% trial-to-paid conversion (baseline: 35-40%)
Paid Tier (Stories 4+):
Goal: Retain subscribers for 12+ months
Strategy: Maintain prompt quality through Story 20, then taper
Target: 80% annual retention
Revenue Impact:
Baseline: 1,000 paid users × $149 = $149,000/year
5% conversion lift: +345 users × $149 = +$51,405/year
AI cost: $2,170/year (includes lesson extraction)
Net gain: $49,235/year (ROI: 22x)
2. SYSTEM ARCHITECTURE OVERVIEW
2.1 Two-Phase Processing System
┌──────────────────────────────────────────────────────┐
│           PHASE 1: IMMEDIATE PROCESSING              │
│  • Trigger: User stops recording                     │
│  • Parallel: Transcribe + Format + Lesson           │
│  • Cost: ~$0.002 per story                          │
│  • Time: 1.7 seconds                                │
│  • Output: Review screen with editable content      │
└──────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────┐
│         PHASE 2: BACKGROUND PROCESSING               │
│  • Trigger: User saves story (at milestones)        │
│  • Combined: Prompts + Character Analysis           │
│  • Cost: $0.01-0.15 per milestone                   │
│  • Time: 5-10 seconds (invisible to user)           │
│  • Output: Prompts + Character insights             │
└──────────────────────────────────────────────────────┘
2.2 Three-Tier Prompt System
┌──────────────────────────────────────────────────────┐
│                    TIER 1: TEMPLATES                 │
│  • Trigger: After every story save (synchronous)     │
│  • Method: Regex keyword extraction + template match │
│  • Cost: $0 (no API call)                           │
│  • Expiry: 7 days                                   │
│  • Coverage: 60-70% of stories                      │
└──────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────┐
│                 TIER 2: ON-DEMAND AI                 │
│  • Trigger: When active_prompts is empty            │
│  • Method: GPT-4o analyzes last 3-5 stories         │
│  • Cost: ~$0.05 per generation                      │
│  • Expiry: 14 days                                  │
│  • Frequency: 2-3x per month per user               │
└──────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────┐
│              TIER 3: MILESTONE ANALYSIS              │
│  • Trigger: At stories 1,2,3,4,7,10,15,20,30,50,100 │
│  • Method: GPT-4o analyzes ALL stories              │
│  • Cost: $0.012-0.15 per analysis                   │
│  • Expiry: 30 days (60 days for premium seed)      │
│  • Generates: Prompts + Character insights          │
└──────────────────────────────────────────────────────┘
2.3 Processing Flow
Story Recording Stops
      ↓
IMMEDIATE (1.7s):
├── Whisper → Transcribe (1s)
└── Parallel GPT-4 calls:
    ├── Format transcript (0.7s)
    └── Generate lessons (0.7s)
      ↓
Review Screen Shows
      ↓
User Edits & Saves
      ↓
Story Saved to DB
      ↓
Check if Milestone
      ↓
      YES → Background Job:
            ├── Generate prompts
            ├── Extract character traits
            └── Store insights
      ↓
      NO → Done
2.4 Key Design Principles
Speed First: Review screen in <2 seconds
Generate More, Show Less: Always generate 3-5 candidates, show top 1-2
Deduplication: anchor_hash prevents semantic duplicates
Safety First: do_not_ask + content classifier before insertion
Graceful Degradation: Circuit breaker → decade fallback
Cost Efficiency: Templates first (free), AI only when needed
3. USER FLOWS
3.1 Free Tier Flow (Stories 1-3)
┌──────────────────────────────────────────────────────────────┐
│                       STORY 1 FLOW                            │
└──────────────────────────────────────────────────────────────┘
User registers → Onboarding (birth year) → Timeline (empty)
                                              ↓
                                    Ghost prompts appear
                                    "1955 - The Year I Was Born"
                                              ↓
                                    User taps prompt → Records Story 1
                                              ↓
                         POST /api/stories (story 1 data)
                                              ↓
                              ┌───────────────┴───────────────┐
                              ↓                               ↓
                    Save to database              Tier 1: Extract keywords
                    Set free_stories_used = 1      Generate 1 template prompt
                              ↓                     (expires in 7 days)
                    Tier 3: Story 1 Milestone                ↓
                    GPT-4o generates 5 candidates   Store in active_prompts
                    Score and filter (≥50)
                    Store top 2
                              ↓
                    Return success to client
                              ↓
                    User sees timeline with Story 1 card
                              ↓
                    "Next Story" card appears:
                    "What happened the morning after you told
                     your father you were quitting?"
                    📍 Based on your 1955 story
                              ↓
                    [Record This Story 🎤] [Skip]
┌──────────────────────────────────────────────────────────────┐
│                       STORY 2 FLOW                            │
└──────────────────────────────────────────────────────────────┘
User taps "Record This Story" → Records Story 2
                                              ↓
                         POST /api/stories (story 2 data)
                                              ↓
                    Save to database
                    Set free_stories_used = 2
                    Mark previous prompt as used
                              ↓
                    Tier 1: Generate 1 template
                              ↓
                    Tier 3: Story 2 Milestone
                    GPT-4o analyzes both stories
                    Generates 4 candidates (2 expansion, 2 connection)
                    Score and filter
                    Store top 2
                              ↓
                    User sees "Next Story" card:
                    "Your father appears in both stories.
                     What's your earliest memory of him?"
                    📍 Connecting 1955 and 1982
┌──────────────────────────────────────────────────────────────┐
│                   STORY 3 + PAYWALL FLOW                      │
└──────────────────────────────────────────────────────────────┘
User records Story 3
                              ↓
                    POST /api/stories (story 3 data)
                              ↓
                    Save to database
                    Set free_stories_used = 3
                              ↓
                    Tier 1: Generate 1 template
                              ↓
                    Tier 3: Story 3 Milestone (SPECIAL)
                    GPT-4o analyzes all 3 stories
                    Generates 5 candidates
                    Score and filter
                              ↓
                    Store candidate #1 (highest score):
                      - is_locked = false (show immediately)
                      - expires_at = NOW() + 30 days
                              ↓
                    Store candidates #2-4 (premium seed):
                      - is_locked = true (hidden until payment)
                      - expires_at = NULL (unlocked on payment)
                              ↓
                    Return success
                              ↓
╔══════════════════════════════════════════════════════════════╗
║              PAYWALL CARD APPEARS                             ║
║                                                               ║
║  ✨ YOUR STORY 3 INSIGHT                                     ║
║                                                               ║
║  "Your father appears in all 3 stories. Tell me about        ║
║   the first time you disappointed him."                      ║
║                                                               ║
║  📍 Based on stories from 1955, 1960, 1982                   ║
║                                                               ║
║  ─────────────────────────────────────────────────────────   ║
║                                                               ║
║  💡 I've analyzed your first 3 stories and found             ║
║     3 more specific memories you should record.              ║
║                                                               ║
║  Ready to unlock your full story?                            ║
║                                                               ║
║     [See What I Found - $149/year]                           ║
║                                                               ║
║     [Maybe later]                                            ║
╚══════════════════════════════════════════════════════════════╝
                              ↓
                    User clicks "See What I Found"
                              ↓
                    Stripe checkout → Payment success
                              ↓
                    Webhook: POST /api/webhooks/stripe
                              ↓
                    Update users table:
                      subscription_status = 'active'
                              ↓
                    Unlock premium seed:
                      UPDATE active_prompts
                      SET is_locked = false,
                          expires_at = NOW() + INTERVAL '60 days'
                      WHERE user_id = $1 AND is_locked = true
                              ↓
                    User redirected to timeline
                              ↓
                    Sees 4 prompts available (1 original + 3 premium)
3.2 Paid Tier Flow (Stories 4+)
┌──────────────────────────────────────────────────────────────┐
│                   RECORDING STORY 4-20                        │
└──────────────────────────────────────────────────────────────┘
User records Story N
                              ↓
                    POST /api/stories
                              ↓
                    Save to database
                              ↓
                    Tier 1: Generate 1 template prompt (always)
                              ↓
                    Check if milestone (4,7,10,15,20,30,50,100)
                              ↓
                    YES → Tier 3 Analysis
                          - Stories 4-20: Generate 3 prompts
                          - Stories 30-50: Generate 2 prompts  
                          - Stories 100+: Generate 1 prompt
                              ↓
                    NO → Continue
                              ↓
                    Return success
┌──────────────────────────────────────────────────────────────┐
│                   EMPTY INVENTORY SCENARIO                    │
└──────────────────────────────────────────────────────────────┘
User opens timeline
                              ↓
                    GET /api/prompts/next
                              ↓
                    Query active_prompts WHERE:
                      - user_id = $1
                      - expires_at > NOW()
                      - is_locked = false
                              ↓
                    EMPTY RESULT
                              ↓
                    Check last_tier2_attempt timestamp
                              ↓
                    < 24 hours ago → Return decade fallback
                              ↓
                    ≥ 24 hours ago → Generate Tier 2 prompt
                                    - Fetch last 5 stories
                                    - GPT-4o analysis
                                    - Generate 5 candidates
                                    - Score and filter
                                    - Store top 2
                                    - Update last_tier2_attempt
                              ↓
                    Return prompt to client
3.3 Grace Period Flow (Non-Payer After Story 3)
Day 0: User records Story 3, sees paywall, clicks "Maybe later"
       - Can still VIEW timeline and stories
       - Cannot RECORD Story 4
       - Email: "Your Story 3 analysis is ready"
Day 1-6: User can browse read-only
         - Timeline shows all 3 stories
         - "Record" button shows paywall
         - Prompts visible but locked
Day 3: Email: "I found 3 more memories you should record"
Day 5: Email: "Last chance - your access expires in 2 days"
Day 7: Account goes read-only
       - Cannot record
       - Cannot view prompts
       - Can still see story titles (teaser)
       - Banner: "Subscribe to access your stories and prompts"
4. DATABASE SCHEMA
4.1 Schema Additions
sql
-- ============================================================================
-- STORIES TABLE ADDITIONS
-- ============================================================================
-- Add columns for lesson learned functionality
ALTER TABLE stories ADD COLUMN IF NOT EXISTS lesson_learned TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS lesson_alternatives JSONB DEFAULT '[]'::jsonb;
-- Stores alternative lesson suggestions user can choose from
ALTER TABLE stories ADD COLUMN IF NOT EXISTS character_insights JSONB;
-- Stores character analysis from milestone processing
ALTER TABLE stories ADD COLUMN IF NOT EXISTS source_prompt_id UUID;
-- References active_prompts.id (but not FK since prompt gets deleted)
CREATE INDEX idx_stories_source_prompt ON stories(source_prompt_id) 
WHERE source_prompt_id IS NOT NULL;

-- Life Phase Context 
ALTER TABLE stories ADD COLUMN IF NOT EXISTS story_year INTEGER; 
ALTER TABLE stories ADD COLUMN IF NOT EXISTS story_age INTEGER; 
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_year INTEGER; 

-- Computed/cached for performance 
ALTER TABLE stories ADD COLUMN IF NOT EXISTS life_phase TEXT; 
-- Values: 'childhood' (0-12), 'teen' (13-19), 'early_adult' (20-29), 
-- 'mid_adult' (30-49), 'late_adult' (50-64), 'senior' (65+) 
CREATE INDEX idx_stories_life_phase ON stories(life_phase);

-- ============================================================================
-- CHARACTER EVOLUTION TABLE
-- ============================================================================
-- Tracks character development across stories
CREATE TABLE character_evolution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_count INTEGER NOT NULL,
  
  -- Character analysis
  traits JSONB, -- [{trait: "resilience", confidence: 0.85, evidence: [...]}]
  invisible_rules TEXT[], -- ["Never ask for help twice", "Family first"]
  contradictions JSONB, -- [{stated: "...", lived: "...", tension: "..."}]
  
  -- Metadata
  analyzed_at TIMESTAMP DEFAULT NOW(),
  model_version TEXT DEFAULT 'gpt-4o',
  
  -- Indexes
  UNIQUE(user_id, story_count)
);
CREATE INDEX idx_character_evolution_user ON character_evolution(user_id, story_count DESC);
sql
-- ============================================================================
-- ACTIVE PROMPTS TABLE
-- ============================================================================
-- Stores currently active prompts (1-5 per user at any time)
-- Prompts expire and are archived to prompt_history
CREATE TABLE active_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Prompt content
  prompt_text TEXT NOT NULL,
  context_note TEXT, -- e.g., "Based on your 1955 story"
  
  -- Deduplication & anchoring
  anchor_entity TEXT, -- e.g., "father's workshop", "Mrs. Henderson"
  anchor_year INTEGER, -- e.g., 1955 (NULL if not year-specific)
  anchor_hash TEXT NOT NULL, -- sha1(`${type}|${entity}|${year||'NA'}`)
  
  -- Tier & quality
  tier INTEGER NOT NULL, -- 0=fallback, 1=template, 2=on-demand, 3=milestone
  memory_type TEXT, -- person_expansion, object_origin, decade_gap, etc.
  prompt_score INTEGER, -- 0-100 (recording likelihood from GPT-4o)
  score_reason TEXT, -- 1-sentence explanation for audit
  model_version TEXT DEFAULT 'gpt-4o', -- Track which model generated it
  
  -- Lifecycle
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL, -- Auto-cleanup after expiry
  is_locked BOOLEAN DEFAULT false, -- true = hidden until payment
  
  -- Engagement tracking
  shown_count INTEGER DEFAULT 0,
  last_shown_at TIMESTAMP,
  
  -- Constraints
  UNIQUE(user_id, anchor_hash) -- Prevent duplicate prompts
);
-- Indexes
CREATE INDEX idx_active_prompts_user ON active_prompts(user_id, expires_at DESC);
CREATE INDEX idx_active_prompts_tier ON active_prompts(tier, prompt_score DESC);
CREATE INDEX idx_active_prompts_locked ON active_prompts(user_id, is_locked);
-- ============================================================================
-- PROMPT HISTORY TABLE
-- ============================================================================
-- Archives used/skipped/expired prompts for analytics
CREATE TABLE prompt_history (
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
  outcome TEXT NOT NULL, -- 'used' | 'skipped' | 'expired'
  story_id UUID, -- NULL if skipped/expired, set if used
  
  -- Timestamps
  created_at TIMESTAMP,
  resolved_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_prompt_history_outcome ON prompt_history(user_id, outcome, tier);
CREATE INDEX idx_prompt_history_story ON prompt_history(story_id) WHERE story_id IS NOT NULL;
-- ============================================================================
-- USERS TABLE ADDITIONS
-- ============================================================================
-- Add columns to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_stories_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none';
-- Values: 'none', 'active', 'cancelled', 'expired'
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_tier2_attempt TIMESTAMP;
-- Rate limit Tier 2 on-demand generation (max 1 per 24 hours)
ALTER TABLE users ADD COLUMN IF NOT EXISTS do_not_ask JSONB DEFAULT '[]'::jsonb;
-- Array of topics user doesn't want to be asked about
-- Example: ["divorce", "mother's death", "bankruptcy"]
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_t3_ran_at TIMESTAMP;
-- Track when Story 1/2/3 analysis ran (for debugging)
-- ============================================================================
-- STORIES TABLE ADDITIONS
-- ============================================================================
-- Add column to track which prompt generated this story
ALTER TABLE stories ADD COLUMN IF NOT EXISTS source_prompt_id UUID;
-- References active_prompts.id (but not FK since prompt gets deleted)
CREATE INDEX idx_stories_source_prompt ON stories(source_prompt_id) 
WHERE source_prompt_id IS NOT NULL;
-- ============================================================================
-- CLEANUP JOB (Daily)
-- ============================================================================
-- Archive expired prompts and clean up old history
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
END;
$$ LANGUAGE plpgsql;
-- Schedule daily (use pg_cron or external scheduler)
5. API SPECIFICATIONS

## 5.1 POST /api/transcribe

Purpose: Transcribe audio and generate lesson suggestions

New endpoint - processes recording immediately

```typescript
POST /api/transcribe
Authorization: Bearer {jwt_token}
Content-Type: application/json
{
  "audioBase64": "...",
  "mimeType": "audio/webm"
}
```

Response:
```typescript
{
  "transcription": "Formatted story text...",
  "lessonOptions": [
    "Never let pride cost you a relationship that matters",
    "Sometimes love means letting someone be wrong",
    "The need to be right can make you very alone"
  ],
  "duration": 120 // estimated seconds
}
```

Server-Side Logic:
```typescript
async function handleTranscribe(req, res) {
  const { audioBase64, mimeType } = req.body;
  const audioBuffer = Buffer.from(audioBase64, 'base64');
  
  // Step 1: Whisper transcription (required first)
  const transcription = await openai.audio.transcriptions.create({
    file: audioStream,
    model: "whisper-1"
  });
  
  // Step 2: Parallel GPT-4 calls for speed
  const [formatted, lessons] = await Promise.all([
    // Format the transcription
    openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // Fast, good enough for formatting
      messages: [{
        role: "system",
        content: "Format this transcribed speech into paragraphs..."
      }, {
        role: "user",
        content: transcription.text
      }],
      temperature: 0.3,
      max_tokens: 3000
    }),
    
    // Generate lesson options (high quality)
    openai.chat.completions.create({
      model: "gpt-4o", // Best model for wisdom extraction
      messages: [{
        role: "system",
        content: `Extract 2-3 possible lessons learned from this story.
        
        Look for:
        - The turning point where understanding shifted
        - What they'd tell their younger self
        - The cost of the experience and what it gave them
        - Universal truths hidden in personal experience
        
        Provide 2-3 options (15-20 words each):
        1. Practical lesson (what to DO)
        2. Emotional truth (what to FEEL)
        3. Character insight (who to BE)`
      }, {
        role: "user",
        content: transcription.text
      }],
      temperature: 0.8, // Higher for creative insights
      max_tokens: 200
    })
  ]);
  
  // Parse responses
  const formattedText = formatted.choices[0].message.content;
  const lessonOptions = parseLessonOptions(lessons.choices[0].message.content);
  
  return res.json({
    transcription: formattedText,
    lessonOptions: lessonOptions,
    duration: estimateDuration(audioBuffer.length)
  });
}
```

## 5.2 POST /api/stories

Purpose: Save a new story and trigger prompt generation

Updated to handle lesson learned

```typescript
POST /api/stories
Authorization: Bearer {jwt_token}
Content-Type: application/json
{
  "storyYear": 1955,
  "storyAge": 23, 
  "transcript": "I was 23 when I decided to leave medical school...",
  "audioUrl": "https://supabase.co/storage/...",
  "lessonLearned": "Sometimes you have to disappoint others to be true to yourself",
  "photos": [
    { "url": "https://...", "heroPhoto": true }
  ],
  "sourcePromptId": "uuid-of-prompt-if-applicable" // Optional
}
```

Server-Side Logic:
```typescript
async function handleStoryCreate(req, res) {
  const userId = req.user.id;
  const { storyYear, storyAge, transcript, audioUrl, photos, lessonLearned, sourcePromptId } = req.body;

  // 1. Save story to database (includes lesson)
  const story = await db.stories.create({
    userId,
    storyYear,
    storyAge, // ADD THIS
    lifePhase: getLifePhase(storyAge), // ADD THIS
    transcript,
    audioUrl,
    photos,
    lessonLearned,
    sourcePromptId,
    createdAt: new Date()
  });

  // 1.5 NEW: Compute and cache birth year if needed
  const user = await db.users.findById(userId);
  if (!user.birthYear && storyAge && storyYear) {
    const birthYear = storyYear - storyAge;
    await db.users.update(userId, { birthYear });
  }

  // 2. Update free_stories_used counter
  const freeStoriesUsed = user.free_stories_used + 1;
  await db.users.update(userId, { free_stories_used: freeStoriesUsed });
  
  // 3. Mark source prompt as used (if applicable)
  if (sourcePromptId) {
    const prompt = await db.active_prompts.findById(sourcePromptId);
    
    // Archive to history
    await db.prompt_history.create({
      userId,
      promptText: prompt.prompt_text,
      anchorHash: prompt.anchor_hash,
      anchorEntity: prompt.anchor_entity,
      tier: prompt.tier,
      memoryType: prompt.memory_type,
      promptScore: prompt.prompt_score,
      shownCount: prompt.shown_count,
      outcome: 'used',
      storyId: story.id,
      createdAt: prompt.created_at
    });
    
    // Delete from active
    await db.active_prompts.delete(sourcePromptId);
  }
  
  // 4. Generate Tier 1 template prompt (synchronous, fast)
  const tier1Prompt = generateTier1Template(transcript, storyYear);
  if (tier1Prompt) {
    await db.active_prompts.create({
      userId,
      promptText: tier1Prompt.text,
      contextNote: tier1Prompt.context,
      anchorEntity: tier1Prompt.entity,
      anchorYear: storyYear,
      anchorHash: generateAnchorHash(tier1Prompt),
      tier: 1,
      memoryType: tier1Prompt.type,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
  }
  
  // 5. Check for Tier 3 milestone - trigger COMBINED analysis
  const storyCount = await db.stories.count({ userId });
  const milestones = [1, 2, 3, 4, 7, 10, 15, 20, 30, 50, 100];
  
  if (milestones.includes(storyCount)) {
    // Queue background job for combined analysis
    await queue.add('analyze-milestone', {
      userId,
      storyCount,
      storyId: story.id,
      isFreeTier: freeStoriesUsed <= 3,
      analysisType: 'combined' // Prompts + Character insights
    });
  }
  
  return res.json({
    success: true,
    story,
    promptsGenerated: {
      tier1: tier1Prompt ? 1 : 0,
      tier3: milestones.includes(storyCount) ? 'queued' : 0
    }
  });
}
```

## 5.3 POST /api/prompts/skip

Purpose: User clicked "Skip" on a prompt

Request:
```typescript
POST /api/prompts/skip
Authorization: Bearer {jwt_token}
Content-Type: application/json
{
  "promptId": "prompt-uuid"
}
```

Response:
```typescript
{
  "success": true,
  "nextPrompt": {
    "id": "next-prompt-uuid",
    "text": "Tell me about your mother...",
    // ... full prompt object
  }
}
```

Server-Side Logic:
```typescript
async function handlePromptSkip(req, res) {
  const userId = req.user.id;
  const { promptId } = req.body;
  
  const prompt = await db.active_prompts.findById(promptId);
  
  if (!prompt || prompt.user_id !== userId) {
    return res.status(404).json({ error: 'Prompt not found' });
  }
  
  // Increment shown count
  const newShownCount = prompt.shown_count + 1;
  
  // Retire prompt if skipped 3+ times
  if (newShownCount >= 3) {
    // Archive to history
    await db.prompt_history.create({
      userId,
      promptText: prompt.prompt_text,
      anchorHash: prompt.anchor_hash,
      tier: prompt.tier,
      memoryType: prompt.memory_type,
      promptScore: prompt.prompt_score,
      shownCount: newShownCount,
      outcome: 'skipped',
      createdAt: prompt.created_at
    });
    
    // Delete from active
    await db.active_prompts.delete(promptId);
  } else {
    // Just increment skip count
    await db.active_prompts.update(promptId, {
      shownCount: newShownCount,
      lastShownAt: new Date()
    });
  }
  
  // Return next prompt
  const nextPrompt = await getNextPrompt({ user: { id: userId } }, res);
  return res.json({ success: true, nextPrompt });
}
```

## 5.4 POST /api/webhooks/stripe

Purpose: Handle Stripe subscription webhook (payment success)

Request:
```typescript
POST /api/webhooks/stripe
Stripe-Signature: {signature}
Content-Type: application/json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "customer": "cus_xxx",
      "client_reference_id": "user-uuid",
      "payment_status": "paid"
    }
  }
}
```

Server-Side Logic:
```typescript
async function handleStripeWebhook(req, res) {
  const event = req.body;
  
  if (event.type === 'checkout.session.completed') {
    const userId = event.data.object.client_reference_id;
    
    // 1. Update subscription status
    await db.users.update(userId, {
      subscription_status: 'active',
      subscription_started_at: new Date()
    });
    
    // 2. Unlock premium seed prompts (from Story 3)
    await db.active_prompts.updateMany(
      {
        userId,
        isLocked: true
      },
      {
        isLocked: false,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
      }
    );
    
    // 3. Send welcome email (optional)
    await sendEmail({
      to: user.email,
      subject: "Welcome to HeritageWhisper Premium!",
      body: "Your personalized prompts are now unlocked..."
    });
    
    return res.json({ received: true });
  }
  
  // Handle other events (subscription cancelled, etc.)
  // ...
}


# 6. AI PROMPT TEMPLATES

## 6.1 Story 1 Analysis (Free Tier)

Purpose: Expand a single story to find implied moments

OpenAI Request:
```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  temperature: 0.7,
  response_format: { type: 'json_object' },
  messages: [
    {
      role: 'system',
      content: \`You are analyzing the FIRST story someone shared. Your job is to find what was IMPLIED but not fully told in this ONE story.

LIFE PHASE CONTEXT:
The storyteller was \${storyAge} years old (\${lifePhase}) when this happened.
Adjust your prompt language to match this life phase:
\${LIFE_PHASE_VOICES[lifePhase].tone}
Use verbs and questions that fit how a \${lifePhase} would experience and remember events.

Generate 5 candidate prompts that expand THIS story (not find gaps, there aren't any yet).

LOOK FOR:
1. THE MOMENT BEFORE
   - They jumped into the middle. What led up to this?
   - "I decided to leave" → What happened the day before you decided?

2. THE MOMENT AFTER
   - They told the decision, not the aftermath
   - "I quit medical school" → What happened the next morning?

3. OTHER PEOPLE IMPLIED
   - "My father was disappointed" → What did your mother say?
   - "Mrs. Henderson taught me" → Who else was in that classroom?

4. SENSORY GAPS (especially important for \${lifePhase} memories)
   - They told WHAT happened, not what it felt/looked/smelled like
   - "The workshop" → What did it smell like in there?

5. IMPLIED BACKSTORY
   - They referenced something without explaining it
   - "That old watch" → Where did that watch come from?

GENERATE 5 PROMPTS THAT:
✅ Ask about something SPECIFIC from this story
✅ Feel like you're genuinely curious (not generic)
✅ Make them think: "Oh wow, it actually read my story"
✅ Trigger recording (not analysis)
✅ Match the \${lifePhase} perspective (\${LIFE_PHASE_VOICES[lifePhase].verbStyle})

For EACH prompt, you must also generate:
- A recording_likelihood score (0-100)
- A brief reasoning (1 sentence)
- A life_phase_fit score (0-100) - how well it matches \${lifePhase} memory retrieval

The scoring criteria:
- Specificity: References exact people/places/objects from story
- Emotional resonance: Triggers feeling, not just facts
- Kindness: Curious, not confrontational
- Recording likelihood: Will they hit "Record" or "Skip"?
- Life phase fit: Does it ask the way a \${lifePhase} would remember?

[Rest of the prompt remains the same...]\`
    },
    {
      role: 'user',
      content: \`Story Year: \${storyYear}
Story Age: \${storyAge} (\${lifePhase})
Transcript:
\${transcript}
Generate 5 expansion prompts for this first story.\`
    }
  ]
});
```

## 6.2 Story 2 Analysis (Free Tier)

Purpose: Light connection between two stories or deeper expansion

OpenAI Request:
```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  temperature: 0.7,
  response_format: { type: 'json_object' },
  messages: [
    {
      role: 'system',
      content: `You are analyzing the first 2 stories someone has shared.

LIFE PHASE CONTEXT:
Story 1: Age ${story1Age} (${story1LifePhase}) - ${LIFE_PHASE_VOICES[story1LifePhase].tone}
Story 2: Age ${story2Age} (${story2LifePhase}) - ${LIFE_PHASE_VOICES[story2LifePhase].tone}

Generate 4 candidate prompts that either:
A) Expand one of these stories (like Story 1 approach)
B) Connect these two stories (if there's a meaningful connection)
C) Bridge life phases if they're different (childhood vs adult perspective on same theme)

LOOK FOR CONNECTIONS:
- Same person mentioned in both stories
- Same emotion in both stories (pride, fear, etc)
- Same location/setting in different times
- Opposite outcomes (success vs failure, joy vs grief)
- Time gap worth exploring (what happened between?)
- LIFE PHASE CONNECTIONS: How did the ${story1LifePhase} experience shape the ${story2LifePhase}?

CONNECTION PROMPTS (if connections exist):
- "You mentioned [person] in both stories. Tell me about the first time you met them."
- "You felt [emotion] in both moments. Tell me about another time you felt that way."
- "Story 1 was in [year], Story 2 in [year]. What happened between those years?"
- For different life phases: "How did that [childhood/teen] lesson show up when you were [adult]?"

EXPANSION PROMPTS (if no clear connection):
- Use Story 1 techniques on whichever story has more expansion potential
- Focus on sensory details appropriate to that life phase
- Match questions to how that age would experience things

[Rest of the prompt remains the same...]`
    },
    {
      role: 'user',
      content: `Story 1 (${story1Year}, Age ${story1Age}):
${story1Transcript}
Story 2 (${story2Year}, Age ${story2Age}):
${story2Transcript}
Generate 4 prompts that either connect these stories or expand on them.`
    }
  ]
});
```

## 6.3 Story 3 Analysis (Free Tier) - THE KILLER PROMPT

Purpose: Generate THE BEST prompt to convince user to pay

OpenAI Request:
```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  temperature: 0.8,
  response_format: { type: 'json_object' },
  messages: [
    {
      role: 'system',
      content: \`You are analyzing 3 stories to generate the MOST COMPELLING prompt possible.

This is a free user deciding whether to pay $149/year. This prompt must be EXCEPTIONAL.

LIFE PHASE ANALYSIS:
Story 1: Age \${story1Age} (\${story1LifePhase})
Story 2: Age \${story2Age} (\${story2LifePhase})
Story 3: Age \${story3Age} (\${story3LifePhase})
Life span covered: \${Math.max(story1Age, story2Age, story3Age) - Math.min(story1Age, story2Age, story3Age)} years

Generate 5 candidate prompts. We will show ONLY the best one.

PRIORITY ORDER:
1. LIFE PHASE PATTERN (if exists)
   - Same theme across different ages → "You learned about loss at 7 and again at 47. What happened in between?"
   - Missing life phase → "You've shared childhood and senior stories. What about your 30s?"
   - Evolution of relationship → "Your father taught you at 8, disappointed you at 23. When did you forgive him?"

2. STRONG PATTERN (if exists)
   - Same person in 2+ stories → Ask about that relationship
   - Same emotion in 2+ stories → Ask about that feeling's origin
   - Recurring theme/value → Surface it directly

3. COMPELLING GAP (if exists)
   - 30+ year gap between stories → Ask what happened in between
   - All positive → Ask about challenge/failure
   - All about work → Ask about family/love

4. DEEP EXPANSION (fallback)
   - Pick the most emotionally resonant story
   - Ask about implied moment that carries weight
   - Match the question to that story's life phase

THE GOAL:
Make them think: "WOW!!! This thing GETS me. I need to pay for this."
Show that you understand not just WHAT happened, but WHEN in their life it happened and WHY that timing matters. Make it a memorable experience they will talk about at dinner.

[Rest of the prompt remains the same...]\`
    },
    {
      role: 'user',
      content: \`Story 1 (\${story1Year}, Age \${story1Age}):
\${story1Transcript}
Story 2 (\${story2Year}, Age \${story2Age}):
\${story2Transcript}
Story 3 (\${story3Year}, Age \${story3Age}):
\${story3Transcript}
Generate 5 prompts. We need THE BEST one to show before the paywall.\`
    }
  ]
});
```

## 6.4 Tier 2 On-Demand (Paid Users)

Purpose: Generate prompts when inventory is empty

OpenAI Request:
```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  temperature: 0.7,
  response_format: { type: 'json_object' },
  messages: [
    {
      role: 'system',
      content: \`You are a memory activation specialist helping seniors remember forgotten life stories.
Your job: Generate 5 prompts that trigger SPECIFIC memories they haven't recorded yet.

LIFE PHASE CONTEXT:
User's current age: \${currentAge}
Birth year: \${birthYear}
Stories span ages: \${ageRange}
Most common life phase in stories: \${dominantLifePhase}
Missing life phases: \${missingPhases}

You have access to their last 3-5 stories. Find what's IMPLIED but not told.

LIFE-PHASE AWARE SEARCHING:
1. PEOPLE AT DIFFERENT AGES
   - "Your mother" in childhood vs "Mom" in adulthood
   - Teachers (childhood), Bosses (adult), Doctors (senior)
   - Friends vs colleagues vs grandchildren

2. OBJECTS ACROSS TIME
   - Toys → Tools → Heirlooms
   - Bikes → Cars → Walkers
   - Match object questions to the life phase

3. PLACES THAT EVOLVE
   - Childhood home → First apartment → Family house
   - Playground → Office → Garden
   - Ask about places in age-appropriate ways

4. MOMENTS BY LIFE PHASE
   - Childhood: Sensory, wonder, firsts
   - Teen: Identity, belonging, rebellion
   - Early adult: Decisions, partnerships, proving
   - Mid adult: Building, leading, sacrificing
   - Late adult: Mentoring, patterns, wisdom
   - Senior: Meaning, reconciliation, legacy

5. FILL LIFE PHASE GAPS
   - If no teen stories: "What were you like at 16?"
   - If no parent stories: "Tell me about becoming a parent"
   - Target the missing decades

GENERATE 5 PROMPTS THAT:
✅ Use specific details from THEIR stories (names, places, years)
✅ Ask about concrete moments, not abstract themes
✅ Match the question style to the life phase it targets
✅ Feel like a curious grandchild who knows your life's timeline
✅ High probability of "Oh! I should record that!"

[Rest of the prompt remains the same...]\`
    },
    {
      role: 'user',
      content: \`Recent stories:
\${recentStories.map((s, i) => \`Story \${i+1} (\${s.year}, Age \${s.age}, \${s.lifePhase}):
\${s.transcript.slice(0, 800)}...\`).join('\\n\\n')}

Missing life phases in their timeline: \${missingPhases}
Generate 5 prompts based on these stories.\`
    }
  ]
});
```

## 6.6 Combined Milestone Analysis (Prompts + Character + Lesson Enhancement)

Purpose: Single API call for all analysis at milestones

New section - maximizes efficiency

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  temperature: 0.7,
  response_format: { type: 'json_object' },
  messages: [
    {
      role: 'system',
      content: \`You are analyzing \${storyCount} stories to perform three tasks:
      1. Generate memory prompts for future recordings
      2. Extract character insights and patterns
      3. Identify core lessons and wisdom
      This person has shared \${storyCount} stories with you. Analyze them comprehensively.\`
    },
    {
      role: 'user',
      content: \`
PART A: PROMPT GENERATION
Generate \${promptCount} prompts that will trigger new memories.
[Use logic from sections 6.1-6.5 based on story count]
PART B: CHARACTER ANALYSIS
From ALL \${storyCount} stories, extract:
1. CHARACTER TRAITS (3-5 core traits)
   - Each trait needs evidence from specific stories
   - Confidence score (0-1) based on repetition
   - Direct quotes that demonstrate the trait
2. INVISIBLE RULES (2-3 principles they live by)
   - Patterns in their decision-making
   - Unspoken values that guide them
   - Rules they follow but may not articulate
3. CONTRADICTIONS (if any exist)
   - Values they state vs behaviors they show
   - Tensions in their character
   - Unresolved conflicts in their worldview
4. CORE LESSONS (distilled wisdom)
   - What would they tell their younger self?
   - What did life teach them?
   - What wisdom emerges from their stories?
Stories to analyze:
\${stories.map((s, i) => \`
Story \${i+1} (Year \${s.year}):
\${s.transcript}
Lesson they wrote: \${s.lessonLearned}
\`).join('\\n---\\n')}
Return comprehensive JSON with all findings.\`
    }
  ],
  messages: [
    {
      role: 'assistant',
      content: `{
  "prompts": [
    {
      "prompt": "You mentioned your father's workshop in 3 stories. Tell me about the last time you were there.",
      "trigger": "recurring_location",
      "anchor_entity": "father's workshop",
      "recording_likelihood": 88,
      "reasoning": "Strong emotional anchor appearing multiple times"
    },
    // ... more prompts based on story count
  ],
  "characterInsights": {
    "traits": [
      {
        "trait": "resilience",
        "confidence": 0.85,
        "evidence": [
          "Story 1: 'I just kept going, what else could I do?'",
          "Story 3: 'Giving up was never an option'",
          "Story 7: 'You fall down seven times, get up eight'"
        ]
      },
      {
        "trait": "duty-before-desire",
        "confidence": 0.72,
        "evidence": [
          "Story 2: Chose family business over art school",
          "Story 5: Worked weekends to support family"
        ]
      }
    ],
    "invisibleRules": [
      "Never let them see you sweat",
      "Family comes first, even when it costs you",
      "If you're not 15 minutes early, you're late"
    ],
    "contradictions": [
      {
        "stated": "Money doesn't matter",
        "lived": "Worked 80-hour weeks for 30 years",
        "tension": "Financial security was actually paramount"
      }
    ],
    "coreLessons": [
      "The things you sacrifice for family are never really lost",
      "Sometimes the hardest thing and the right thing are the same",
      "You can't go back, but you can always start over"
    ]
  }
}\`
    }
  ]
});
```

// Process the combined response
async function processMilestoneAnalysis(response) {
  const data = JSON.parse(response.choices[0].message.content);
  
  // Store prompts
  for (const prompt of data.prompts) {
    await storePrompt(userId, prompt, 3, isLocked);
  }
  
  // Store character insights
  await db.character_evolution.create({
    userId,
    storyCount,
    traits: data.characterInsights.traits,
    invisibleRules: data.characterInsights.invisibleRules,
    contradictions: data.characterInsights.contradictions,
    analyzedAt: new Date(),
    modelVersion: 'gpt-4o'
  });
  
  // Update story with enhanced insights
  await db.stories.update(storyId, {
    characterInsights: data.characterInsights
  });
  
  return data;
}

## 6.7 Life Phase Tone Matching

```typescript
const LIFE_PHASE_VOICES = {
  childhood: {
    tone: "concrete sensory details, wonder, simple cause-effect",
    examples: ["What did it smell like?", "Who else was there?", "What color was..."]
  },
  teen: {
    tone: "peer context, identity formation, firsts",
    examples: ["Who were you trying to impress?", "What made you different from..."]
  },
  early_adult: {
    tone: "agency, decisions, partnership, proving yourself",
    examples: ["What were you choosing between?", "How did you know you were ready?"]
  },
  mid_adult: {
    tone: "responsibility, tradeoffs, building something",
    examples: ["What did you sacrifice for...", "Who depended on your choice?"]
  },
  late_adult: {
    tone: "wisdom earned, patterns recognized, mentoring",
    examples: ["What would you tell someone facing...", "When did you realize..."]
  },
  senior: {
    tone: "meaning-making, blessings counted, reconciliation",
    examples: ["What still matters from...", "Who do you think of when..."]
  }
};
```

# 7. BUSINESS LOGIC & ALGORITHMS

## 7.1 Tier 1 Template Generation

Function: Extract entities and match templates

```typescript
// ============================================================================
// ENTITY EXTRACTION
// ============================================================================
interface ExtractedEntities {
  people: string[];
  places: string[];
  objects: string[];
  emotions: string[];
  temporalBoundaries: string[];
}
function extractEntities(transcript: string): ExtractedEntities {
  // Normalize text (case-insensitive matching)
  const normalized = transcript.toLowerCase();
  
  // Extract people (proper nouns followed by action verbs)
  const peoplePatterns = [
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(said|told|taught|showed|gave|asked|wanted|helped|loved)/gi,
    /my\s+(?:friend|teacher|father|mother|brother|sister|boss|mentor)\s+([A-Z][a-z]+)/gi
  ];
  
  const people = new Set<string>();
  peoplePatterns.forEach(pattern => {
    const matches = transcript.matchAll(pattern);
    for (const match of matches) {
      people.add(match[1]);
    }
  });
  
  // Extract places (prepositions + capitalized locations)
  const placePatterns = [
    /\b(?:at|in|near|by|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
    /\b(?:the)\s+(workshop|office|house|apartment|school|church|hospital|factory)/gi
  ];
  
  const places = new Set<string>();
  placePatterns.forEach(pattern => {
    const matches = transcript.matchAll(pattern);
    for (const match of matches) {
      places.add(match[1]);
    }
  });
  
  // Extract objects (possessives + concrete nouns)
  const objectPatterns = [
    /\b(?:my|his|her|our|their|the)\s+([\w\s]+?)\s+(?:that|which|was|had|sat|hung)/gi
  ];
  
  const objects = new Set<string>();
  objectPatterns.forEach(pattern => {
    const matches = normalized.matchAll(pattern);
    for (const match of matches) {
      const obj = match[1].trim();
      // Filter out common words
      if (obj.length > 3 && !['that', 'this', 'there', 'thing'].includes(obj)) {
        objects.add(obj);
      }
    }
  });
  
  // Extract emotions
  const emotionWords = [
    'proud', 'scared', 'angry', 'happy', 'sad', 'disappointed', 
    'excited', 'nervous', 'ashamed', 'relieved', 'terrified',
    'joyful', 'anxious', 'grateful', 'regretful'
  ];
  
  const emotions = emotionWords.filter(emotion => 
    normalized.includes(emotion)
  );
  
  // Extract temporal boundaries
  const temporalPatterns = [
    /(first|last|only)\s+time/gi
  ];
  
  const temporalBoundaries: string[] = [];
  temporalPatterns.forEach(pattern => {
    const matches = transcript.matchAll(pattern);
    for (const match of matches) {
      temporalBoundaries.push(match[0]);
    }
  });
  
  return {
    people: Array.from(people),
    places: Array.from(places),
    objects: Array.from(objects),
    emotions,
    temporalBoundaries
  };
}
// ============================================================================
// TEMPLATE LIBRARY
// ============================================================================
interface PromptTemplate {
  trigger: string;
  patterns: string[];
  context: string;
  priority: number;
}
const TEMPLATE_LIBRARY: Record<string, PromptTemplate> = {
  person_expansion: {
    trigger: 'person_mentioned',
    patterns: [
      "Tell me about the first time you met {person}.",
      "What's the clearest memory you have of {person}?",
      "{person} sounds important. What did they teach you?",
      "What did {person} look like? Describe them.",
      "What's something {person} said that you've never forgotten?"
    ],
    context: "You mentioned {person} in your recent story",
    priority: 90
  },
  
  object_origin: {
    trigger: 'object_mentioned',
    patterns: [
      "Where did your {object} come from?",
      "Tell me the story of how you got {object}.",
      "Do you still have {object}? What happened to it?",
      "Who gave you {object}?",
      "What's the first memory you have with {object}?"
    ],
    context: "You mentioned {object}",
    priority: 85
  },
  
  place_memory: {
    trigger: 'place_mentioned',
    patterns: [
      "What's your first memory of {place}?",
      "Describe {place}. If I walked in, what would I see?",
      "What did {place} smell like?",
      "Who else was usually at {place}?",
      "Tell me about the last time you were at {place}."
    ],
    context: "You mentioned {place}",
    priority: 88
  },
  
  emotion_expansion: {
    trigger: 'emotion_detected',
    patterns: [
      "Tell me about another time you felt {emotion} like that.",
      "What's the most {emotion} you've ever been?",
      "Who else was there when you felt {emotion}?",
      "Where in your body did you feel that {emotion}?"
    ],
    context: "You felt {emotion}",
    priority: 75
  },
  
  temporal_sequence: {
    trigger: 'temporal_boundary',
    patterns: [
      "What happened right after that {temporal} time?",
      "Tell me about the {opposite_temporal} time.",
      "What led up to that {temporal} time?"
    ],
    context: "You mentioned a {temporal} time",
    priority: 70
  }
};
// ============================================================================
// TEMPLATE MATCHING
// ============================================================================
interface Tier1Prompt {
  text: string;
  context: string;
  entity: string;
  type: string;
  anchorHash: string;
}
function generateTier1Template(
  transcript: string, 
  storyYear: number
): Tier1Prompt | null {
  const entities = extractEntities(transcript);
  
  // Priority order (most likely to trigger recording)
  if (entities.people.length > 0) {
    const person = entities.people[0];
    const template = TEMPLATE_LIBRARY.person_expansion;
    const pattern = template.patterns[Math.floor(Math.random() * template.patterns.length)];
    
    return {
      text: pattern.replace('{person}', person),
      context: template.context.replace('{person}', person),
      entity: person,
      type: 'person_expansion',
      anchorHash: generateAnchorHash('person_expansion', person, storyYear)
    };
  }
  
  if (entities.objects.length > 0) {
    const object = entities.objects[0];
    const template = TEMPLATE_LIBRARY.object_origin;
    const pattern = template.patterns[Math.floor(Math.random() * template.patterns.length)];
    
    return {
      text: pattern.replace('{object}', object),
      context: template.context.replace('{object}', object),
      entity: object,
      type: 'object_origin',
      anchorHash: generateAnchorHash('object_origin', object, storyYear)
    };
  }
  
  if (entities.places.length > 0) {
    const place = entities.places[0];
    const template = TEMPLATE_LIBRARY.place_memory;
    const pattern = template.patterns[Math.floor(Math.random() * template.patterns.length)];
    
    return {
      text: pattern.replace('{place}', place),
      context: template.context.replace('{place}', place),
      entity: place,
      type: 'place_memory',
      anchorHash: generateAnchorHash('place_memory', place, storyYear)
    };
  }
  
  if (entities.emotions.length > 0) {
    const emotion = entities.emotions[0];
    const template = TEMPLATE_LIBRARY.emotion_expansion;
    const pattern = template.patterns[Math.floor(Math.random() * template.patterns.length)];
    
    return {
      text: pattern.replace('{emotion}', emotion),
      context: template.context.replace('{emotion}', emotion),
      entity: emotion,
      type: 'emotion_expansion',
      anchorHash: generateAnchorHash('emotion_expansion', emotion, storyYear)
    };
  }
  
  // Fallback: decade-based generic
  const decade = Math.floor(storyYear / 10) * 10;
  return {
    text: \`What was a typical Saturday like in the \${decade}s?\`,
    context: \`Based on your \${storyYear} story\`,
    entity: \`\${decade}s\`,
    type: 'decade_context',
    anchorHash: generateAnchorHash('decade_context', \`\${decade}s\`, decade)
  };
}
// ============================================================================
// ANCHOR HASH GENERATION
// ============================================================================
function generateAnchorHash(
  type: string, 
  entity: string, 
  year: number | null
): string {
  const crypto = require('crypto');
  const normalized = entity.toLowerCase().trim();
  const yearStr = year ? year.toString() : 'NA';
  const input = \`\${type}|\${normalized}|\${yearStr}\`;
  
  return crypto.createHash('sha1').update(input).digest('hex');
}

## 7.2 Generate-and-Filter Algorithm

Function: Generate multiple candidates, score, filter, store best

```typescript
// ============================================================================
// SCORE FILTERING
// ============================================================================
interface ScoredPrompt {
  prompt: string;
  trigger: string;
  anchorEntity: string;
  anchorYear: number | null;
  recordingLikelihood: number;
  reasoning: string;
}
async function generateAndFilterPrompts(
  userId: string,
  tier: number,
  context: any
): Promise<void> {
  // 1. Generate candidates based on tier
  let candidates: ScoredPrompt[];
  
  if (tier === 1) {
    // Template generation (handled separately)
    return;
  } else if (tier === 2) {
    // On-demand generation
    candidates = await generateTier2Candidates(userId);
  } else if (tier === 3) {
    // Milestone generation
    candidates = await generateTier3Candidates(userId, context.storyCount);
  }
  
  // 2. Filter by minimum score threshold
  const MIN_SCORE = 50;
  const filtered = candidates.filter(c => c.recordingLikelihood >= MIN_SCORE);
  
  if (filtered.length === 0) {
    // All candidates scored too low - retry with different approach
    console.warn(\`All candidates scored below \${MIN_SCORE} for user \${userId}\`);
    
    if (tier === 3 && context.isFreeTier) {
      // Free tier failure is critical - retry once with sensory focus
      candidates = await generateTier3Candidates(userId, context.storyCount, 'sensory_only');
      const retryFiltered = candidates.filter(c => c.recordingLikelihood >= MIN_SCORE);
      
      if (retryFiltered.length === 0) {
        // Still failed - use decade fallback
        const fallback = await generateDecadeFallback(userId);
        await storePrompt(userId, fallback, tier);
        return;
      }
      
      filtered.push(...retryFiltered);
    } else {
      // Paid tier failure - just use decade fallback
      const fallback = await generateDecadeFallback(userId);
      await storePrompt(userId, fallback, tier);
      return;
    }
  }
  
  // 3. Sort by score descending
  filtered.sort((a, b) => b.recordingLikelihood - a.recordingLikelihood);
  
  // 4. Determine how many to store
  let countToStore = 1;
  if (tier === 3) {
    if (context.storyCount === 3) {
      // Story 3 special case: store top 4 (1 shown, 3 locked)
      countToStore = 4;
    } else if (context.storyCount <= 20) {
      countToStore = 3; // Early milestones
    } else if (context.storyCount <= 50) {
      countToStore = 2; // Mid milestones
    } else {
      countToStore = 1; // Late milestones
    }
  } else if (tier === 2) {
    countToStore = 2; // On-demand generates 2
  }
  
  const toStore = filtered.slice(0, countToStore);
  
  // 5. Store prompts
  for (let i = 0; i < toStore.length; i++) {
    const candidate = toStore[i];
    const isLocked = (tier === 3 && context.storyCount === 3 && i > 0); // Lock premium seed
    
    await storePrompt(userId, candidate, tier, isLocked);
  }
}

// ============================================================================
// STORE PROMPT
// ============================================================================
async function storePrompt(
  userId: string,
  prompt: ScoredPrompt,
  tier: number,
  isLocked: boolean = false
): Promise<void> {
  const anchorHash = generateAnchorHash(
    prompt.trigger,
    prompt.anchorEntity,
    prompt.anchorYear
  );
  
  // Determine expiry based on tier
  let expiryDays: number;
  if (isLocked) {
    expiryDays = 0; // NULL (set on unlock)
  } else if (tier === 1) {
    expiryDays = 7;
  } else if (tier === 2) {
    expiryDays = 14;
  } else if (tier === 3) {
    expiryDays = 30;
  } else {
    expiryDays = 7; // Fallback
  }
  
  const expiresAt = isLocked 
    ? null 
    : new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  
  // Check if prompt already exists (deduplication)
  const existing = await db.active_prompts.findOne({
    where: { userId, anchorHash }
  });
  
  if (existing) {
    console.log(\`Duplicate prompt detected for user \${userId}, skipping:\`, prompt.prompt);
    return;
  }
  
  // Insert
  await db.active_prompts.create({
    userId,
    promptText: prompt.prompt,
    contextNote: \`Based on your \${prompt.anchorYear || 'stories'}\`,
    anchorEntity: prompt.anchorEntity,
    anchorYear: prompt.anchorYear,
    anchorHash,
    tier,
    memoryType: prompt.trigger,
    promptScore: prompt.recordingLikelihood,
    scoreReason: prompt.reasoning,
    modelVersion: 'gpt-4o',
    expiresAt,
    isLocked
  });
}
```

## 7.3 Decade Fallback Generator

Function: Generate safe fallback when AI fails or inventory is empty

```typescript
async function generateDecadeFallback(userId: string): Promise<ScoredPrompt> {
  const user = await db.users.findById(userId);
  const stories = await db.stories.find({ userId });
  
  // Find decades the user has lived through but hasn't recorded from
  const currentYear = new Date().getFullYear();
  const birthYear = user.birthYear;
  const age = currentYear - birthYear;
  
  // All decades they've lived through
  const livedDecades: number[] = [];
  for (let year = birthYear; year <= currentYear; year += 10) {
    const decade = Math.floor(year / 10) * 10;
    if (!livedDecades.includes(decade)) {
      livedDecades.push(decade);
    }
  }
  
  // Decades with existing stories
  const recordedDecades = new Set(
    stories.map(s => Math.floor(s.storyYear / 10) * 10)
  );
  
  // Unrecorded decades
  const unrecordedDecades = livedDecades.filter(d => !recordedDecades.has(d));
  
  // Pick random unrecorded decade
  let decade: number;
  if (unrecordedDecades.length > 0) {
    decade = unrecordedDecades[Math.floor(Math.random() * unrecordedDecades.length)];
  } else {
    // All decades covered - pick random decade they lived through
    decade = livedDecades[Math.floor(Math.random() * livedDecades.length)];
  }
  
  // Generate decade-based prompt
  const prompts = [
    \`Tell me about a typical Saturday in the \${decade}s.\`,
    \`What was your favorite thing about the \${decade}s?\`,
    \`What do you remember most about \${decade}?\`,
    \`Tell me a story from the \${decade}s that makes you smile.\`,
    \`What was happening in your life in \${decade}?\`
  ];
  
  const promptText = prompts[Math.floor(Math.random() * prompts.length)];
  
  return {
    prompt: promptText,
    trigger: 'decade_fallback',
    anchorEntity: \`\${decade}s\`,
    anchorYear: decade,
    recordingLikelihood: 60, // Lower score for generic prompts
    reasoning: 'Decade-based fallback prompt'
  };
}
```

## 7.4 Lesson Extraction Logic

New section - handles immediate lesson generation

```typescript

// ============================================================================
// LESSON EXTRACTION FOR REVIEW SCREEN
// ============================================================================
interface LessonOptions {
  practical: string;    // What to DO
  emotional: string;    // What to FEEL
  character: string;    // Who to BE
  selected?: string;    // Which one user chose
}
async function extractLessons(transcript: string): Promise<LessonOptions> {
  // Called during transcription processing (parallel with formatting)
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o', // Best quality for wisdom extraction
    messages: [
      {
        role: 'system',
        content: `You are extracting life lessons from personal stories.
        
        Your goal is to find the wisdom that can be passed to future generations.
        Each lesson should be 15-20 words, clear, and meaningful.
        
        Avoid:
        - Generic platitudes ("Be yourself", "Follow your heart")
        - Overly specific details that won't apply to others
        - Negative framing ("Don't trust people")
        - Abstract philosophy
        
        Focus on:
        - Universal truths discovered through personal experience
        - Practical wisdom that guides decisions
        - Character insights that shape who we become
        - The cost and value of choices made`
      },
      {
        role: 'user',
        content: \`From this story, extract 3 different types of lessons:

        1. PRACTICAL LESSON (what to DO in similar situations)
        2. EMOTIONAL TRUTH (what to FEEL or how to process emotions)
        3. CHARACTER INSIGHT (who to BE or what kind of person to become)

        Story: "\${transcript}"

        Return exactly 3 lessons, each 15-20 words.\`
      }
    ],
    temperature: 0.8, // Higher for more creative, insightful responses
    max_tokens: 150
  });
  
  // Parse the response
  const lessons = parseGPTLessons(completion.choices[0].message.content);
  
  return {
    practical: lessons[0] || "Every experience teaches something if you're willing to learn from it",
    emotional: lessons[1] || "The heart remembers what the mind forgets",
    character: lessons[2] || "Who you become matters more than what you achieve"
  };
}
function parseGPTLessons(content: string): string[] {
  // Extract lessons from GPT response
  const lines = content.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  const lessons = lines
    .filter(line => {
      // Look for numbered items or lessons
      return /^[1-3][\.\):]/.test(line) || 
             line.toLowerCase().includes('lesson') ||
             line.length > 10;
    })
    .map(line => {
      // Clean up numbering and labels
      return line.replace(/^[1-3][\.\):]\s*/, '')
                 .replace(/^(PRACTICAL|EMOTIONAL|CHARACTER)[:\s]*/i, '')
                 .replace(/^LESSON[:\s]*/i, '')
                 .trim();
    })
    .filter(lesson => lesson.length > 10 && lesson.length < 150);
  
  return lessons.slice(0, 3);
}


// ============================================================================
// LIFE PHASE DETERMINATION
// ============================================================================

function getLifePhase(age: number | null): string | null {
  if (!age) return null;
  if (age <= 12) return 'childhood';
  if (age <= 19) return 'teen';
  if (age <= 29) return 'early_adult';
  if (age <= 49) return 'mid_adult';
  if (age <= 64) return 'late_adult';
  return 'senior';
}

// ============================================================================
// LIFE PHASE TONE ADJUSTMENT
// ============================================================================

const LIFE_PHASE_VOICES = {
  childhood: {
    tone: "concrete sensory details, wonder, simple cause-effect",
    verbStyle: "what did it look/smell/sound like"
  },
  teen: {
    tone: "peer context, identity formation, firsts", 
    verbStyle: "who else was there, what made you different"
  },
  early_adult: {
    tone: "agency, decisions, partnership, proving yourself",
    verbStyle: "what were you choosing between, how did you know"
  },
  mid_adult: {
    tone: "responsibility, tradeoffs, building something",
    verbStyle: "what did you sacrifice for, who depended on"
  },
  late_adult: {
    tone: "wisdom earned, patterns recognized, mentoring",
    verbStyle: "what would you tell someone, when did you realize"
  },
  senior: {
    tone: "meaning-making, blessings counted, reconciliation",
    verbStyle: "what still matters from, who do you think of when"
  }
};

// ============================================================================
// QUALITY SCORING FOR LESSONS
// ============================================================================
function scoreLessonQuality(lesson: string, transcript: string): number {
  let score = 50; // Base score
  
  // Specificity bonus (mentions specific elements from story)
  const storyWords = extractKeywords(transcript);
  const lessonWords = lesson.toLowerCase().split(' ');
  const overlap = lessonWords.filter(word => storyWords.includes(word)).length;
  score += overlap * 10;
  
  // Length penalty (too short or too long)
  const wordCount = lesson.split(' ').length;
  if (wordCount < 10) score -= 20;
  if (wordCount > 25) score -= 10;
  if (wordCount >= 15 && wordCount <= 20) score += 10;
  
  // Cliché penalty
  const cliches = [
    'follow your heart', 'be yourself', 'everything happens',
    'time heals', 'what doesn\'t kill', 'when one door'
  ];
  if (cliches.some(cliche => lesson.toLowerCase().includes(cliche))) {
    score -= 30;
  }
  
  // Action words bonus
  const actionWords = ['choose', 'build', 'create', 'fight', 'protect', 'learn'];
  if (actionWords.some(word => lesson.toLowerCase().includes(word))) {
    score += 15;
  }
  
  return Math.max(0, Math.min(100, score));
}
```

# 8. EDGE CASES & FALLBACKS

## 8.1 Empty Inventory Loop Prevention

Scenario: User opens timeline, no active prompts, Tier 2 generates nothing

Solution: Circuit breaker with rate limit + fallback

```typescript
async function getNextPromptWithCircuitBreaker(userId: string) {
  // 1. Try to fetch existing prompt
  let prompt = await fetchActivePrompt(userId);
  if (prompt) return prompt;
  
  // 2. Check Tier 2 rate limit (max 1 per 24 hours)
  const user = await db.users.findById(userId);
  const lastAttempt = user.last_tier2_attempt;
  const hoursSinceLast = lastAttempt 
    ? (Date.now() - lastAttempt.getTime()) / (1000 * 60 * 60)
    : 999;
  
  if (hoursSinceLast < 24) {
    // Rate limited - immediate fallback
    return await generateDecadeFallback(userId);
  }
  
  // 3. Try Tier 2 generation
  try {
    await db.users.update(userId, { last_tier2_attempt: new Date() });
    
    const tier2Prompt = await generateTier2Prompt(userId);
    
    if (tier2Prompt) {
      return tier2Prompt;
    } else {
      // Generation returned nothing - fallback
      return await generateDecadeFallback(userId);
    }
  } catch (error) {
    // API error - fallback
    console.error('Tier 2 generation failed:', error);
    return await generateDecadeFallback(userId);
  }
}
```

## 8.2 Story 3 Low Quality Scores

Scenario: All 5 Story 3 candidates score < 50 (too low to show)

Solution: Retry with sensory-only focus, then fallback

```typescript
async function generateStory3PromptWithRetry(userId: string): Promise<void> {
  // First attempt: standard Story 3 analysis
  const candidates = await generateStory3Candidates(userId);
  const filtered = candidates.filter(c => c.recordingLikelihood >= 50);
  
  if (filtered.length >= 1) {
    // Success - store as normal
    await storeStory3Prompts(userId, filtered);
    return;
  }
  
  // All candidates failed - retry with sensory focus
  console.warn(\`Story 3 candidates all scored < 50 for user \${userId}, retrying...\`);
  
  const retryPrompt = `
  The previous 5 candidates scored too low. Try again with ONLY sensory detail prompts.
  
  Focus EXCLUSIVELY on:
  - "What did X smell like?"
  - "What color was X?"
  - "What did you hear when X happened?"
  - "Describe the room where X happened"
  
  Generate 3 sensory-focused candidates.
  `;
  
  const retryCandidates = await callOpenAI(retryPrompt);
  const retryFiltered = retryCandidates.filter(c => c.recordingLikelihood >= 50);
  
  if (retryFiltered.length >= 1) {
    // Retry succeeded
    await storeStory3Prompts(userId, retryFiltered);
    return;
  }
  
  // Still failed - use decade fallback as last resort
  console.error(\`Story 3 retry also failed for user \${userId}, using fallback\`);
  
  const fallback = await generateDecadeFallback(userId);
  await storePrompt(userId, fallback, 3, false);
  
  // Also create 3 generic locked prompts for premium seed
  for (let i = 0; i < 3; i++) {
    const genericFallback = await generateDecadeFallback(userId);
    await storePrompt(userId, genericFallback, 3, true); // Locked
  }
}
```

## 8.3 Payment Failure After Story 3

Scenario: User sees Story 3 killer prompt, clicks "See What I Found", but payment fails

Solution: Keep prompts locked, send recovery email

```typescript
// Stripe webhook handler
async function handleStripeWebhook(event) {
  if (event.type === 'checkout.session.expired') {
    const userId = event.data.object.client_reference_id;
    
    // Payment failed or abandoned
    // Prompts remain locked
    
    // Send recovery email
    await sendEmail({
      to: user.email,
      subject: "Your Story Analysis is Still Waiting",
      body: `
        Hi ${user.firstName},
        
        I've analyzed your first 3 stories and found 3 specific memories 
        you should record. Your personalized prompts are ready whenever 
        you're ready to continue.
        
        [Complete Your Subscription - $149/year]
        
        Your prompts will be waiting for you.
      `
    });
    
    return { received: true };
  }
}
```

## 8.4 User Deletes Story That Generated Prompts

Scenario: User deletes Story 2, which generated prompts about "father's workshop"

Solution: Prompts remain valid (they reference the story, but don't require it)

No action needed - prompts are independent of source story. If user asks "What story is this based on?" and can't find it, that's a rare edge case.

Alternative: Mark prompts as source_story_deleted if you want to handle it:

```typescript
async function handleStoryDelete(storyId: string, userId: string) {
  // Delete story
  await db.stories.delete(storyId);
  
  // Optional: Mark related prompts
  await db.active_prompts.updateMany(
    {
      userId,
      sourceStoryIds: { $contains: [storyId] }
    },
    {
      metadata: { sourceStoryDeleted: true }
    }
  );
}
```

## 8.5 User Maxes Out do_not_ask Topics

Scenario: User has blocked 20 topics in do_not_ask, AI can't find anything to ask

Solution: Decade fallback + notification

```typescript
async function generateWithSafetyFilter(userId: string) {
  const user = await db.users.findById(userId);
  const bannedTopics = user.do_not_ask || [];
  
  if (bannedTopics.length > 15) {
    console.warn(\`User \${userId} has \${bannedTopics.length} blocked topics\`);
  }
  
  // Generate candidates
  const candidates = await generateCandidates(userId);
  
  // Filter out banned topics
  const safe = candidates.filter(c => {
    const lowerPrompt = c.prompt.toLowerCase();
    return !bannedTopics.some(topic => lowerPrompt.includes(topic.toLowerCase()));
  });
  
  if (safe.length === 0) {
    // All prompts blocked - use decade fallback
    return await generateDecadeFallback(userId);
  }
  
  return safe;
}
```

# 9. SAFETY & COMPLIANCE

## 9.1 do_not_ask Implementation

Purpose: User-controlled topic blocking

Storage:
```sql
-- In users table
do_not_ask JSONB DEFAULT '[]'::jsonb
-- Example value:
["divorce", "mother's death", "bankruptcy", "cancer"]
```

UI Flow:
```
User clicks "I don't want to be asked about this" on a prompt
  ↓
Modal: "What topic should I avoid?"
  ↓
User types: "my divorce"
  ↓
UPDATE users SET do_not_ask = do_not_ask || '["divorce"]'
WHERE id = $userId
  ↓
Delete any active prompts containing "divorce"
  ↓
Future prompts filtered before insertion
```

Implementation:
```typescript
async function addToDoNotAsk(userId: string, topic: string): Promise<void> {
  // Normalize topic
  const normalized = topic.toLowerCase().trim();
  
  // Add to user's do_not_ask list
  await db.query(`
    UPDATE users
    SET do_not_ask = 
      CASE 
        WHEN do_not_ask IS NULL THEN $2::jsonb
        ELSE do_not_ask || $2::jsonb
      END
    WHERE id = $1
  `, [userId, JSON.stringify([normalized])]);
  
  // Delete any active prompts containing this topic
  const prompts = await db.active_prompts.find({ userId });
  
  for (const prompt of prompts) {
    if (prompt.prompt_text.toLowerCase().includes(normalized)) {
      await db.active_prompts.delete(prompt.id);
      console.log(\`Removed prompt containing banned topic "\${topic}":\`, prompt.prompt_text);
    }
  }
}
async function filterBannedTopics(
  userId: string, 
  candidates: ScoredPrompt[]
): Promise<ScoredPrompt[]> {
  const user = await db.users.findById(userId);
  const bannedTopics = user.do_not_ask || [];
  
  if (bannedTopics.length === 0) {
    return candidates;
  }
  
  return candidates.filter(c => {
    const lowerPrompt = c.prompt.toLowerCase();
    const containsBanned = bannedTopics.some(topic => 
      lowerPrompt.includes(topic.toLowerCase())
    );
    return !containsBanned;
  });
}
```

## 9.2 Content Safety Classifier

Purpose: Block sensitive topics before insertion

Blocked Topics:
```typescript
const SENSITIVE_TOPICS = {
  trauma: [
    'abuse', 'assault', 'molest', 'rape', 'violence', 
    'beaten', 'attacked', 'traumatized'
  ],
  death: [
    'died', 'death', 'funeral', 'suicide', 'killed',
    'passed away', 'terminal', 'fatal'
  ],
  addiction: [
    'alcoholic', 'addict', 'overdose', 'rehab', 
    'drinking problem', 'substance abuse'
  ],
  financial: [
    'bankruptcy', 'foreclosure', 'eviction', 'homeless',
    'broke', 'debt', 'financial ruin'
  ],
  infidelity: [
    'affair', 'cheated', 'infidelity', 'adultery',
    'unfaithful', 'mistress', 'lover'
  ],
  medical: [
    'cancer', 'diagnosis', 'surgery', 'hospital',
    'disease', 'illness', 'treatment'
  ]
};
Classification Function:
typescript
function classifyPromptSafety(promptText: string): {
  safe: boolean;
  category?: string;
  matched?: string;
} {
  const lowerPrompt = promptText.toLowerCase();
  
  for (const [category, keywords] of Object.entries(SENSITIVE_TOPICS)) {
    for (const keyword of keywords) {
      if (lowerPrompt.includes(keyword)) {
        return {
          safe: false,
          category,
          matched: keyword
        };
      }
    }
  }
  
  return { safe: true };
}
Application:
typescript
async function storePromptWithSafety(
  userId: string,
  prompt: ScoredPrompt,
  tier: number
): Promise<void> {
  // Check safety
  const safety = classifyPromptSafety(prompt.prompt);
  
  if (!safety.safe) {
    console.warn(
      \`Blocked unsafe prompt for user \${userId}:\`,
      \`Category: \${safety.category}, Matched: \${safety.matched}\`
    );
    return; // Don't store
  }
  
  // Check user's do_not_ask
  const user = await db.users.findById(userId);
  const bannedTopics = user.do_not_ask || [];
  
  for (const topic of bannedTopics) {
    if (prompt.prompt.toLowerCase().includes(topic.toLowerCase())) {
      console.warn(\`Blocked prompt matching do_not_ask topic "\${topic}"\`);
      return; // Don't store
    }
  }
  
  // Safe - proceed with storage
  await storePrompt(userId, prompt, tier);
}
Exception: User initiates the topic
typescript
// If user's story mentions "cancer", it's OK to ask follow-ups about cancer
// The classifier only blocks UNSOLICITED sensitive prompts
function shouldAllowSensitiveTopic(
  prompt: string,
  userStories: Story[]
): boolean {
  const safety = classifyPromptSafety(prompt);
  
  if (safety.safe) return true;
  
  // Check if user already discussed this topic
  const userMentionedIt = userStories.some(story => 
    story.transcript.toLowerCase().includes(safety.matched)
  );
  
  if (userMentionedIt) {
    console.log(
      `Allowing sensitive prompt because user initiated topic: ${safety.matched}`
    );
    return true;
  }
  
  return false;
}
```

## 9.3 Recent Death Detection

Purpose: Never ask about deaths within 1 year

Implementation:
```typescript
function detectRecentDeath(transcript: string, storyYear: number): boolean {
  const deathIndicators = [
    /died/i, /passed away/i, /funeral/i, /buried/i,
    /lost (my|our) (mom|dad|mother|father|wife|husband|son|daughter)/i
  ];
  
  const currentYear = new Date().getFullYear();
  const yearsSinceDeath = currentYear - storyYear;
  
  if (yearsSinceDeath < 1) {
    // Story is from this year - check for death mentions
    return deathIndicators.some(pattern => pattern.test(transcript));
  }
  
  return false;
}
// In generateTier1Template:
if (detectRecentDeath(transcript, storyYear)) {
  console.log('Skipping Tier 1 prompt generation - recent death detected');
  return null; // Don't generate any prompt
}
```

# 10. METRICS & SUCCESS CRITERIA

## 10.1 Primary KPIs

Prompt → Recording Conversion Rate
```sql
-- Overall conversion by tier
SELECT 
  tier,
  COUNT(CASE WHEN outcome = 'used' THEN 1 END)::FLOAT / COUNT(*) * 100 AS conversion_rate,
  AVG(shown_count) AS avg_shows_before_outcome
FROM prompt_history
GROUP BY tier
ORDER BY tier;
-- Targets:
-- Tier 1: ≥ 50%
-- Tier 2: ≥ 70%
-- Tier 3: ≥ 80%
Free Tier Funnel Conversion
sql
-- Story 1 → Story 2 → Story 3 → Payment
SELECT 
  COUNT(CASE WHEN free_stories_used >= 1 THEN 1 END) AS reached_story_1,
  COUNT(CASE WHEN free_stories_used >= 2 THEN 1 END) AS reached_story_2,
  COUNT(CASE WHEN free_stories_used >= 3 THEN 1 END) AS reached_story_3,
  COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) AS converted_to_paid,
  
  COUNT(CASE WHEN free_stories_used >= 2 THEN 1 END)::FLOAT / 
    NULLIF(COUNT(CASE WHEN free_stories_used >= 1 THEN 1 END), 0) * 100 AS story1_to_2_rate,
  
  COUNT(CASE WHEN free_stories_used >= 3 THEN 1 END)::FLOAT / 
    NULLIF(COUNT(CASE WHEN free_stories_used >= 2 THEN 1 END), 0) * 100 AS story2_to_3_rate,
  
  COUNT(CASE WHEN subscription_status = 'active' THEN 1 END)::FLOAT / 
    NULLIF(COUNT(CASE WHEN free_stories_used >= 3 THEN 1 END), 0) * 100 AS story3_to_paid_rate
FROM users
WHERE created_at >= '2025-01-01';
-- Targets:
-- Story 1 → 2: ≥ 65%
-- Story 2 → 3: ≥ 55%
-- Story 3 → Paid: ≥ 45%
10.2 Secondary Metrics
Stories Per User Per Month
sql
SELECT 
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*)::FLOAT / COUNT(DISTINCT user_id) AS avg_stories_per_user
FROM stories
WHERE created_at >= NOW() - INTERVAL '6 months'
GROUP BY month
ORDER BY month;
-- Target: ≥ 3 stories/user/month for active users
Days Between Recordings
sql
WITH story_gaps AS (
  SELECT 
    user_id,
    created_at,
    LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at) AS prev_created_at,
    EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at))) / 86400 AS days_since_last
  FROM stories
)
SELECT 
  AVG(days_since_last) AS avg_days_between_stories,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_since_last) AS median_days
FROM story_gaps
WHERE days_since_last IS NOT NULL;
-- Target: ≤ 10 days average
Prompt Skip Rate
sql
SELECT 
  tier,
  memory_type,
  COUNT(*) AS total_skipped,
  AVG(shown_count) AS avg_shows_before_skip
FROM prompt_history
WHERE outcome = 'skipped'
GROUP BY tier, memory_type
ORDER BY total_skipped DESC;
-- Target: < 2 skips before use
Active Prompt Inventory Health
sql
SELECT 
  user_id,
  COUNT(*) AS active_prompts,
  AVG(prompt_score) AS avg_score,
  MAX(expires_at) AS furthest_expiry
FROM active_prompts
WHERE expires_at > NOW()
  AND is_locked = false
GROUP BY user_id
HAVING COUNT(*) > 5;
-- Target: 1-5 active prompts per user (not >5)

10.3 Quality Metrics
Prompt Score Correlation with Conversion
sql
-- Does higher prompt_score actually lead to more "used" outcomes?
SELECT 
  CASE 
    WHEN prompt_score >= 80 THEN '80-100'
    WHEN prompt_score >= 60 THEN '60-79'
    WHEN prompt_score >= 40 THEN '40-59'
    ELSE '0-39'
  END AS score_bucket,
  COUNT(CASE WHEN outcome = 'used' THEN 1 END)::FLOAT / COUNT(*) * 100 AS conversion_rate
FROM prompt_history
WHERE tier IN (2, 3)  -- Only AI-generated prompts
GROUP BY score_bucket
ORDER BY score_bucket DESC;
-- Expected: Higher scores → higher conversion
-- If not, scorer needs refinement
Tier Effectiveness
sql
SELECT 
  tier,
  COUNT(*) AS total_generated,
  COUNT(CASE WHEN outcome = 'used' THEN 1 END) AS used,
  COUNT(CASE WHEN outcome = 'skipped' THEN 1 END) AS skipped,
  COUNT(CASE WHEN outcome = 'expired' THEN 1 END) AS expired,
  AVG(prompt_score) AS avg_score
FROM prompt_history
GROUP BY tier
ORDER BY tier;
-- Insights:
-- High expiry rate → increase expiry window
-- High skip rate → improve prompt quality
-- Low usage → wrong prompts being generated

Memory Type Performance
sql
SELECT 
  memory_type,
  COUNT(*) AS total,
  COUNT(CASE WHEN outcome = 'used' THEN 1 END)::FLOAT / COUNT(*) * 100 AS conversion_rate,
  AVG(prompt_score) AS avg_score
FROM prompt_history
WHERE tier = 1  -- Templates only
GROUP BY memory_type
ORDER BY conversion_rate DESC;
-- Identifies which template types work best
-- Retire low-performing templates

-- Prompt effectiveness by life phase SELECT life_phase, COUNT(*) as total_prompts, AVG(CASE WHEN outcome = 'used' THEN 1.0 ELSE 0.0 END) * 100 as conversion_rate FROM prompt_history ph JOIN stories s ON ph.story_id = s.id GROUP BY life_phase ORDER BY conversion_rate DESC;


10.4 Business Impact Metrics
Incremental Revenue from AI Prompts
sql
-- Compare conversion rates: users who saw AI prompts vs control
-- (Requires A/B test setup)
SELECT 
  CASE WHEN saw_tier3_prompt THEN 'With AI' ELSE 'Control' END AS cohort,
  COUNT(*) AS users,
  COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) AS conversions,
  COUNT(CASE WHEN subscription_status = 'active' THEN 1 END)::FLOAT / COUNT(*) * 100 AS conversion_rate
FROM (
  SELECT 
    u.id,
    u.subscription_status,
    EXISTS(
      SELECT 1 FROM prompt_history ph 
      WHERE ph.user_id = u.id AND ph.tier = 3 AND ph.outcome = 'used'
    ) AS saw_tier3_prompt
  FROM users u
  WHERE u.created_at >= '2025-01-01'
) cohorts
GROUP BY cohort;
-- Calculate lift:
-- (With AI conversion rate - Control conversion rate) / Control conversion rate * 100
Cost Per Conversion
sql
-- Assume $1,757 annual AI cost for 1,000 paid users
SELECT 
  COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) AS paid_users,
  1757.0 / NULLIF(COUNT(CASE WHEN subscription_status = 'active' THEN 1 END), 0) AS cost_per_paid_user
FROM users;
-- Target: < $2.00 per paid user
10.5 Dashboard Queries
Weekly Health Check
sql
-- Run every Monday
SELECT 
  'Prompt Conversion' AS metric,
  (SELECT AVG(CASE WHEN outcome = 'used' THEN 1.0 ELSE 0.0 END) * 100 
   FROM prompt_history 
   WHERE created_at >= NOW() - INTERVAL '7 days') AS value,
  70.0 AS target
  
UNION ALL
SELECT 
  'Free Tier Conversion',
  (SELECT COUNT(CASE WHEN subscription_status = 'active' THEN 1 END)::FLOAT / 
          NULLIF(COUNT(CASE WHEN free_stories_used >= 3 THEN 1 END), 0) * 100
   FROM users 
   WHERE created_at >= NOW() - INTERVAL '7 days'),
  45.0
  
UNION ALL
SELECT 
  'Stories Per User',
  (SELECT COUNT(*)::FLOAT / NULLIF(COUNT(DISTINCT user_id), 0)
   FROM stories 
   WHERE created_at >= NOW() - INTERVAL '30 days'),
  3.0
  
UNION ALL
SELECT 
  'Active Prompts',
  (SELECT AVG(cnt) FROM (
    SELECT COUNT(*) AS cnt FROM active_prompts 
    WHERE expires_at > NOW() 
    GROUP BY user_id
  ) x),
  3.0;
10.6 Lesson Quality Metrics
New metrics for lesson extraction feature
sql
-- Lesson acceptance rate (how often users keep AI suggestion)
SELECT 
  DATE_TRUNC('week', created_at) AS week,
  COUNT(*) AS total_stories,
  COUNT(CASE WHEN lesson_learned = lesson_suggested THEN 1 END) AS kept_suggestion,
  COUNT(CASE WHEN lesson_learned != lesson_suggested THEN 1 END) AS edited,
  COUNT(CASE WHEN lesson_learned IS NULL THEN 1 END) AS no_lesson,
  
  COUNT(CASE WHEN lesson_learned = lesson_suggested THEN 1 END)::FLOAT / 
    NULLIF(COUNT(*), 0) * 100 AS acceptance_rate
    
FROM stories
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY week
ORDER BY week DESC;
-- Target: 40% keep as-is, 50% edit slightly, 10% write from scratch
-- Character trait confidence over time
SELECT 
  user_id,
  story_count,
  AVG((traits->>'confidence')::FLOAT) AS avg_confidence,
  COUNT(DISTINCT traits->>'trait') AS unique_traits
FROM character_evolution
GROUP BY user_id, story_count
ORDER BY story_count;
-- Target: Confidence increases with story count
-- Story 3: 0.5-0.6, Story 10: 0.7-0.8, Story 20: 0.8-0.9
11. COST MODEL & BUDGET
11.1 Free Tier Costs
Updated to include lesson extraction
Assumptions:
10,000 signups/year
80% record Story 1 = 8,000 users
65% record Story 2 = 5,200 users
55% record Story 3 = 2,860 users
OpenAI API Costs:
Lesson Extraction (Immediate):
  - 8,000 Story 1s × $0.002 (gpt-4o quick lesson) = $16.00
  - 5,200 Story 2s × $0.002 = $10.40
  - 2,860 Story 3s × $0.002 = $5.72
  
  Subtotal Lessons: $32.12
Combined Analysis at Milestones:
  - Story 1: 8,000 × $0.006 (prompts + character) = $48.00
  - Story 2: 5,200 × $0.008 = $41.60
  - Story 3: 2,860 × $0.010 = $28.60
  
  Subtotal Analysis: $118.20
TOTAL FREE TIER: $150.32/year
11.2 Paid Tier Costs
Updated with lesson extraction
Assumptions:
1,287 paid users (45% conversion from Story 3)
Average 30 stories/user/year
Tier 1 (Templates):
Cost: $0 (no API calls)
Lesson Extraction:
All stories: 1,287 users × 30 stories × $0.002 = $77.22/year
Tier 2 (On-Demand):
Frequency: 2-3x per month per user = ~30 calls/user/year
Cost per call: $0.05 (GPT-4o, 5 stories analyzed)
1,287 users × 30 calls × $0.05 = $1,930.50/year
Tier 3 (Combined Analysis):
Milestones per user (average):
- Story 4: 1,287 users × $0.012 = $15.44
- Story 7: 1,100 users × $0.018 = $19.80
- Story 10: 950 users × $0.024 = $22.80
- Story 15: 800 users × $0.030 = $24.00
- Story 20: 650 users × $0.036 = $23.40
- Story 30: 400 users × $0.054 = $21.60
- Story 50: 200 users × $0.090 = $18.00
- Story 100: 80 users × $0.156 = $12.48
TOTAL TIER 3: $157.52/year
Total Paid Tier: $77.22 + $1,930.50 + $157.52 = $2,165.24/year
11.3 Total Annual Budget
Free Tier:      $150.32
Paid Tier:      $2,165.24
─────────────────────────
TOTAL:          $2,315.56/year
Revenue (1,287 paid users × $149):  $191,763
AI Cost as % of Revenue:            1.21%
Cost Per Paid User:                 $1.80/year
11.4 Scaling Projections
At 10,000 Paid Users:
Free Tier (100k signups):   $1,503
Paid Tier (10k users):      $21,652
────────────────────────
TOTAL:                      $23,155/year
Revenue (10k × $149):       $1,490,000
AI Cost as % of Revenue:    1.55%
At 100,000 Paid Users:
Free Tier (1M signups):     $15,032
Paid Tier (100k users):     $216,524
────────────────────────
TOTAL:                      $231,556/year
Revenue (100k × $149):      $14,900,000
AI Cost as % of Revenue:    1.55%
Cost scales linearly, never exceeds 1.6% of revenue.
11.5 Cost Optimization Opportunities
If budget becomes a concern:
Use GPT-4o-mini for formatting (keep GPT-4o for lessons)
Saves ~$500/year at 1,287 users
Cache common lessons for similar stories
Saves ~$300/year at 1,287 users
Batch milestone processing (process 2-3 users at once)
Saves ~$200/year at 1,287 users
Recommendation: Don't optimize yet. Current cost (1.21% of revenue) is negligible.
12. IMPLEMENTATION CHECKLIST
Phase 1: Foundation (Week 1)
Database:
Add active_prompts table
Add prompt_history table
Add character_evolution table
Add columns to users table
Add columns to stories table (lesson_learned, character_insights)
Create indexes
Create cleanup function
Tier 1 Templates:
Build entity extraction
Build template library
Build template matching function
Build anchor hash generator
Test with 10 real stories
API Endpoints:
Create POST /api/transcribe with parallel processing
Update POST /api/stories to handle lessons
Create GET /api/prompts/next
Create POST /api/prompts/skip
Test all endpoints
Deliverable: Tier 1 templates + lesson extraction working
Phase 2: Free Tier Magic (Week 2)
Immediate Processing:
Implement parallel Whisper + GPT-4 calls
Build lesson extraction with 3 options
Test 1.7 second target time
Integrate with review screen UI
Story Analysis:
Write OpenAI prompt for Story 1
Write OpenAI prompt for Story 2
Write OpenAI prompt for Story 3
Build combined analysis function
Test conversion flow end-to-end
Deliverable: Free tier (Stories 1-3) complete
Phase 3: Payment Integration (Week 2)
Stripe Webhook:
Create POST /api/webhooks/stripe
Handle checkout.session.completed
Unlock premium seed prompts
Send welcome email
Test with Stripe test mode
Grace Period:
Implement 7-day read-only grace
Schedule emails (Day 1, 3, 5)
Lock account on Day 7
Test full grace period flow
Deliverable: Payment → unlock flow working
Phase 4: Paid Tier (Week 3)
Tier 2 On-Demand:
Write OpenAI prompt template
Build rate limiter (24 hours)
Build circuit breaker with fallback
Test empty inventory scenario
Tier 3 Combined Analysis:
Write combined prompt template
Build milestone trigger logic
Integrate character evolution tracking
Test all milestones
Verify background processing
Deliverable: Paid tier complete with character insights
Phase 5: Safety & Quality (Week 3-4)
Safety Systems:
Build content safety classifier
Build do_not_ask UI and backend
Build recent death detection
Test all safety filters
Quality Systems:
Build lesson quality scoring
Track lesson acceptance rates
Build character confidence tracking
Create weekly health dashboard
Document all metrics queries
Deliverable: Safety and quality systems operational
Phase 6: Polish & Launch (Week 4)
UI/UX:
Review screen with lesson options
"Next Story" card component
Paywall card design
Character insights display
Mobile responsive check
Testing:
End-to-end user journey
Load testing (1000 concurrent)
OpenAI error handling
Database cleanup job
Cost tracking dashboard
Launch:
Deploy to production
Monitor error logs
Track conversion metrics
A/B test variations
Deliverable: System in production with monitoring
FINAL NOTES
This Document Contains:
✅ Complete product context and business goals ✅ Full system architecture with dual processing ✅ Detailed user flows for free and paid tiers ✅ Complete database schema with lesson storage ✅ All API endpoint specifications ✅ Parallel processing for 1.7s response time ✅ Combined milestone analysis for efficiency ✅ Exact OpenAI prompt templates ✅ Business logic and algorithms ✅ Edge case handling and fallback strategies ✅ Safety and compliance systems ✅ Metrics, success criteria, and dashboards ✅ Updated cost model with lesson extraction ✅ Implementation checklist with phases
What's NOT in This Document:
❌ Frontend React code (separate spec) ❌ Deployment/infrastructure (separate DevOps doc) ❌ Email templates (separate marketing doc)
How to Use This Document:
Read Section 1 (Product Context) to understand the "why"
Read Section 2 (Architecture) to understand the "how"
Read Sections 3-9 to implement features
Read Section 10 to track success
Read Section 11 to manage costs
Read Section 12 to plan work


