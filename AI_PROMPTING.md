# HeritageWhisper AI Prompting Documentation

> **Last Updated:** January 2025
> **Status:** Production Ready
> **Owner:** Paul Takisaki

## 📋 Table of Contents

1. [Pearl - The Documentary Interviewer](#pearl---the-documentary-interviewer)
2. [AI Prompt Generation System](#ai-prompt-generation-system)
3. [Lesson Extraction System](#lesson-extraction-system)
4. [Technical Implementation](#technical-implementation)
5. [Prompt Engineering Best Practices](#prompt-engineering-best-practices)

---

## 🎙️ Pearl - The Documentary Interviewer

Pearl is HeritageWhisper's AI-powered conversational interviewer that helps users capture vivid life stories through natural dialogue.

### Core Philosophy

**From Rigid Bot to Skilled Interviewer**
- Not a Q&A bot, but a documentary interviewer
- Draws out sensory details, emotions, and forgotten moments
- Personalizes based on user's previous stories
- Uses warm redirects instead of harsh refusals

### Pearl's Prompt System

Located in `/hooks/use-realtime-interview.tsx`:

```typescript
export const PEARL_WITNESS_INSTRUCTIONS = `You are Pearl, an expert interviewer helping someone capture vivid life stories in HeritageWhisper.

YOUR ROLE:
You're like a skilled documentary interviewer - drawing out details, emotions, and forgotten moments that make stories come alive. You know their previous stories and weave that knowledge naturally into the conversation.

EXPERT INTERVIEWING TECHNIQUES:
- Draw out sensory details: "What did you see/hear/smell in that moment?"
- Explore emotions: "What was going through your mind when that happened?"
- Add context: "How old were you? Who else was there? What year was this?"
- Uncover forgotten details: "Close your eyes for a second - what else do you remember?"
- Follow the energy: When they light up about something, dig deeper there
- Use their exact words: If they say "housebroken by love," ask what that meant to them

PERSONALIZATION (USE THEIR DETAILS):
- Reference their actual workplace, hometown, people they've mentioned
- Every 3-4 questions, naturally connect to a previous story they've told
- "You mentioned working at PG&E - was this during that time?"
- "This reminds me of your story about Coach - were they still in your life then?"
- "You've talked about feeling responsible before, with Chewy - how was this different?"

ENCOURAGEMENT (LIGHT TOUCH):
- After good details: "I can really picture that now..."
- After emotional shares: "Thank you for trusting me with this..."
- Milestone moments: "This is your 10th story - you're really building something special here..."
- When they're stuck: "Take your time. Sometimes the details come back slowly..."

SAFETY THROUGH REDIRECTION (NOT REFUSAL):
- If they want to chat/joke: Give a warm brief response, then redirect
- If they ask for advice: Acknowledge importance, redirect to their experience
- If they go off-topic: Connect it back to a previous story
- For therapy/medical/legal: Acknowledge significance, ask how it shaped them`;
```

### Multi-Layer Defense System

Pearl uses a 4-layer defense against off-topic responses:

1. **Model Instructions** - Primary guidance in system prompt
2. **Token Limits** - Max 400 tokens per response
3. **Response Trimmer** - Enforces single question rule
4. **Scope Enforcer** - Server-side guard against violations

#### Scope Enforcer (`/lib/scopeEnforcer.ts`)

```typescript
// Patterns that indicate off-topic content
const OFF_TOPIC = /\b(knock[\s-]?knock|joke|google|search|browser|driver s?|update(s)?|support|device settings?)\b/i;
const OUT_OF_SCOPE = /audio (issue|driver|speaker|mic)|troubleshoot|weather|news|president|calculate|timer|music|advice|therapy|recommend/i;

// Rotating fallback questions
const FALLBACK_QUESTIONS = [
  "How old were you then?",
  "Where did this take place?",
  "What happened next?",
  "Who was with you?",
  "What did the air feel like that day?",
  "What sounds do you remember from that moment?",
];
```

### Pearl Configuration

- **Model:** GPT-4 Realtime (via OpenAI WebRTC)
- **Temperature:** 0.6 (balanced creativity/consistency)
- **Max Tokens:** 400 per response
- **Audio:** Optional voice responses
- **Session Length:** 30 minutes max

---

## 🎯 AI Prompt Generation System

### Overview

Two-tier system that generates personalized reflection prompts based on user's stories.

### Tier 1: Template-Based Entity Prompts

**Trigger:** After EVERY story save
**Cost:** ~$0.0001 per story
**Model:** GPT-4o-mini

#### Process:
1. Extract 1-3 entities (people, places, objects, concepts)
2. Apply templates from 5 categories
3. Generate 1-3 prompts (25-30 words each)
4. SHA1 deduplication
5. 7-day expiry

#### Template Categories:

```javascript
const TEMPLATE_CATEGORIES = {
  APPRECIATION: [
    "{entity} was part of your life. What did they teach you that you didn't realize at the time?",
    "You mentioned {entity}. What would you thank them for if you could?",
  ],
  PERSPECTIVE_SHIFTS: [
    "Looking back at {entity} now, what do you understand differently?",
    "You were {age} when {entity} happened. What would you tell that version of yourself?",
  ],
  UNFINISHED_BUSINESS: [
    "Is there something you never said to {entity} that you wish you had?",
    "What conversation with {entity} still feels incomplete?",
  ],
  INVISIBLE_RULES: [
    "What unspoken rule did {entity} teach you about life?",
    "{entity} shaped how you see the world. What belief did that create?",
  ],
  FUTURE_SELF: [
    "How might {entity} show up in your life five years from now?",
    "What part of {entity} do you hope your grandchildren inherit?",
  ]
};
```

### Tier 3: Milestone Analysis

**Trigger:** Stories 1, 2, 3, 4, 7, 10, 15, 20, 30, 50, 100
**Cost:** ~$0.02-0.15 per milestone
**Model:** GPT-5 with reasoning effort

#### Reasoning Effort by Milestone:
- Stories 1-9: `low` (basic patterns)
- Stories 10-49: `medium` (synthesis)
- Stories 50+: `high` (deep insights)

#### Character Evolution Tracking:

```typescript
interface CharacterInsights {
  traits: Array<{
    trait: string;
    confidence: number;  // 0-1
    evidence: string[];
  }>;
  invisible_rules: string[];
  contradictions: string[];
  core_lessons: string[];
}
```

---

## 📚 Lesson Extraction System

### Overview

Every story gets 2-3 AI-suggested lessons in the user's voice.

### Configuration

**Trigger:** During transcription
**Model:** GPT-4o-mini (90% cost reduction from GPT-4)
**Temperature:** 0.9 (creativity)
**Output:** 3 options, 1-2 sentences each

### Prompt Template:

```javascript
const LESSON_PROMPT = `Based on this story, generate 3 different lesson learned options.
Each should be 1-2 sentences in first person, as if the storyteller is sharing wisdom.
Make each lesson focus on a different aspect or takeaway from the story.

Examples of good lessons:
- "I learned that courage isn't the absence of fear - it's staying when every part of you wants to run."
- "Trust takes years to build but only seconds to destroy. Guard it carefully."
- "Sometimes the hardest person to forgive is yourself, but it's also the most important."

Story transcript:
{transcript}

Generate 3 lesson options:`;
```

### Display Format

Lessons appear in book view with:
- Gold left border (`#D4A574`)
- Italic text
- Between story text and photos

---

## 🔧 Technical Implementation

### File Structure

```
/hooks/
├── use-realtime-interview.tsx    # Pearl's main configuration
├── use-mode-selection.tsx        # Recording mode selector

/lib/
├── realtimeClient.ts             # WebRTC connection to OpenAI
├── scopeEnforcer.ts              # Off-topic detection
├── responseTrimmer.ts            # Response length control
├── tier3Analysis.ts              # Milestone prompt generation
├── whisperGeneration.ts          # Follow-up prompts
├── promptGeneration.ts           # Tier 1 templates

/app/
├── interview-chat/               # Pearl conversation UI
├── prompts/                      # Prompt display page
└── api/
    ├── prompts/                  # Prompt API endpoints
    ├── transcribe/               # Lesson extraction
    └── stories/                  # Story save + prompts
```

### Database Schema

```sql
-- Active prompts for users
CREATE TABLE active_prompts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  prompt_text TEXT NOT NULL,
  context_note TEXT,
  tier INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  shown_count INTEGER DEFAULT 0,
  last_shown_at TIMESTAMPTZ,
  anchor_entity TEXT,
  anchor_year INTEGER
);

-- All generated prompts with retirement tracking
CREATE TABLE prompt_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  prompt_text TEXT NOT NULL,
  prompt_hash TEXT UNIQUE,  -- SHA1 for deduplication
  source TEXT CHECK (source IN ('tier1', 'tier3', 'whisper')),
  status TEXT CHECK (status IN ('active', 'retired', 'answered')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  retired_at TIMESTAMPTZ,
  skip_count INTEGER DEFAULT 0
);

-- Character insights from Tier 3 analysis
CREATE TABLE character_evolution (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  traits JSONB,
  invisible_rules TEXT[],
  contradictions TEXT[],
  core_lessons TEXT[],
  confidence_scores JSONB,
  last_analysis TIMESTAMPTZ,
  story_count INTEGER
);
```

### API Endpoints

```typescript
// Prompt Management
GET  /api/prompts/next       // Fetch next prompt to display
POST /api/prompts/skip       // Mark prompt as skipped
POST /api/prompts/answer     // Mark prompt as answered
GET  /api/prompts/queued     // User's prompt queue
GET  /api/prompts/active     // Personalized prompts
GET  /api/prompts/archived   // Dismissed prompts

// Family Prompts
GET  /api/prompts/family-submitted  // Questions from family

// Story Processing
POST /api/transcribe         // Transcribe + extract lessons
POST /api/stories            // Save story + generate prompts
```

---

## 💡 Prompt Engineering Best Practices

### 1. Temperature Settings

- **Interviews (Pearl):** 0.6 - Natural but consistent
- **Prompt Generation:** 0.8 - Creative variety
- **Lesson Extraction:** 0.9 - Maximum creativity
- **Transcription:** 0.3 - Accuracy focused

### 2. Token Management

```typescript
// Optimal token allocations
const TOKEN_BUDGETS = {
  pearl_response: 400,      // 2-3 sentences + question
  prompt_generation: 100,   // 25-30 words
  lesson_extraction: 150,   // 1-2 sentences × 3
  tier3_analysis: 2000,     // Full story analysis
};
```

### 3. Personalization Techniques

**Use Exact Details:**
- ❌ "your workplace" → ✅ "PG&E"
- ❌ "your pet" → ✅ "Chewy"
- ❌ "back then" → ✅ "in 1975"

**Reference Previous Stories:**
- "Like when you told me about..."
- "This connects to your story about..."
- "You've mentioned this before with..."

### 4. Safety Patterns

**Warm Redirects (not harsh refusals):**
```javascript
// ❌ BAD: "I cannot provide jokes. Share a memory instead."
// ✅ GOOD: "Ha! Speaking of humor, you mentioned Coach had a great sense of humor. What was that like?"

// ❌ BAD: "I am not equipped for therapy."
// ✅ GOOD: "That sounds really significant. While I can't provide therapy guidance, I'd love to hear how that shaped you."
```

### 5. Quality Gates

All prompts must pass:
- **Length:** 25-30 words
- **Specificity:** References user's actual details
- **Uniqueness:** SHA1 hash not in database
- **Relevance:** Connected to recent stories
- **Quality Score:** ≥70/100

### 6. Cost Optimization

```javascript
// Model selection by operation
const MODEL_SELECTION = {
  critical: 'gpt-5',           // Tier 3 milestones
  standard: 'gpt-4o',          // Entity extraction
  efficient: 'gpt-4o-mini',    // Templates, lessons
  realtime: 'gpt-4-realtime',  // Pearl conversations
};
```

---

## 📊 Performance Metrics

### Target Metrics

- **Pearl off-topic rate:** <5%
- **Prompt quality score:** ≥70 average
- **Lesson acceptance rate:** >60%
- **Story 3 conversion:** ≥45%
- **Response latency:** <2s (prompts), <500ms (Pearl)

### Monitoring

```javascript
// Telemetry for all AI operations
{
  op: "ai_call",
  stage: "pearl" | "tier1" | "tier3" | "lesson",
  model: "gpt-5" | "gpt-4o" | "gpt-4o-mini",
  effort: "low" | "medium" | "high",
  latencyMs: 1500,
  costUsd: 0.023,
  tokensUsed: {
    input: 500,
    output: 150,
    reasoning: 300,  // GPT-5 only
    total: 950
  }
}
```

---

## 🚀 Future Enhancements

1. **Voice Cloning:** Pearl speaks in user's deceased spouse's voice
2. **Multi-language:** Pearl interviews in 12+ languages
3. **Video Analysis:** Pearl asks about photos shown during interview
4. **Emotion Detection:** Pearl adjusts approach based on user's tone
5. **Story Graphs:** Visual connections between stories and themes

---

_For implementation details, see CLAUDE.md_
_For historical context, see AI_PROMPT_SYSTEM_V1.4.md_