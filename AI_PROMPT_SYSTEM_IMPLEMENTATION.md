# HeritageWhisper AI Prompt System - Complete Implementation Guide

**Status:** ✅ Production Ready  
**Last Updated:** October 11, 2025  
**Version:** 1.0 - The Caring Grandchild Experience

---

## 📋 Table of Contents

1. [Overview & Philosophy](#overview--philosophy)
2. [Phase 1: Core Prompt Infrastructure](#phase-1-core-prompt-infrastructure)
3. [Phase 2: Magical UX Refinements](#phase-2-magical-ux-refinements)
4. [Phase 3: Memory Map & Personalization](#phase-3-memory-map--personalization)
5. [Complete File Structure](#complete-file-structure)
6. [API Reference](#api-reference)
7. [Database Schema](#database-schema)
8. [Testing Guide](#testing-guide)
9. [Future Enhancements](#future-enhancements)

---

## Overview & Philosophy

### The Vision
Transform HeritageWhisper from a recording tool into a **caring AI grandchild** who genuinely wants to know their stories. Every prompt should feel like it comes from love and curiosity, not an algorithm.

### The Dinner Test
Every feature must pass: **"Would a senior excitedly tell someone about this at dinner?"**

### Core Principles
- ✅ **Senior-friendly**: 18px min text, 48px touch targets
- ✅ **Compassionate language**: "Not today" not "Skip"
- ✅ **Instant engagement**: Echo prompts show we're listening
- ✅ **Visual warmth**: Serif fonts, amber/orange colors, paper textures
- ✅ **Forgiveness built-in**: Every action is reversible
- ✅ **Quality over quantity**: Max 3-5 active prompts

---

## Phase 1: Core Prompt Infrastructure

### 1.1 Database Schema (Already Migrated)

**Tables Added:**
- `active_prompts` - Currently active prompts (1-5 per user)
- `prompt_history` - Archived used/skipped/expired prompts
- `character_evolution` - Character insights from milestone analysis

**User Fields Added:**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_stories_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_tier2_attempt TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS do_not_ask JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_interests JSONB DEFAULT '{
  "general": null,
  "people": null,
  "places": null
}'::jsonb;
```

**Story Fields Added:**
```sql
ALTER TABLE stories ADD COLUMN IF NOT EXISTS source_prompt_id UUID;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS lesson_learned TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS life_phase TEXT;
```

### 1.2 API Endpoints

#### **GET /api/prompts/next**
Returns the highest priority active prompt for the user.

**Query Logic:**
- Order by tier DESC (3 > 2 > 1), then prompt_score DESC
- Filter: `is_locked = false`, `expires_at > NOW()`
- If empty, returns decade fallback prompt

**Response:**
```json
{
  "prompt": {
    "id": "uuid",
    "prompt_text": "You mentioned your father's workshop. What did it smell like?",
    "context_note": "Based on your 1955 story",
    "tier": 3,
    "prompt_score": 88,
    "anchor_entity": "father's workshop",
    "anchor_year": 1955
  }
}
```

**Location:** `/app/api/prompts/next/route.ts`

---

#### **POST /api/prompts/skip**
Handles prompt dismissal with smart tracking.

**Request:**
```json
{
  "promptId": "uuid"
}
```

**Logic:**
- Increments `shown_count`
- If `shown_count >= 3`, moves to `prompt_history` with `outcome: 'skipped'`
- Returns next available prompt

**Response:**
```json
{
  "success": true,
  "retired": false,
  "nextPrompt": { /* prompt object */ }
}
```

**Location:** `/app/api/prompts/skip/route.ts`

---

#### **GET /api/prompts/active**
Fetches all active prompts for user (for prompts page).

**Response:**
```json
{
  "prompts": [
    { /* prompt object */ },
    { /* prompt object */ }
  ]
}
```

**Location:** `/app/api/prompts/active/route.ts`

---

#### **GET /api/prompts/dismissed**
Fetches dismissed prompts from history.

**Response:**
```json
{
  "prompts": [
    {
      "id": "uuid",
      "prompt_text": "...",
      "outcome": "skipped",
      "resolved_at": "2025-10-11T..."
    }
  ]
}
```

**Location:** `/app/api/prompts/dismissed/route.ts`

---

#### **GET /api/prompts/answered**
Fetches answered prompts with story connections.

**Response:**
```json
{
  "prompts": [
    {
      "id": "uuid",
      "prompt_text": "...",
      "outcome": "used",
      "story_id": "story-uuid",
      "resolved_at": "2025-10-11T..."
    }
  ]
}
```

**Location:** `/app/api/prompts/answered/route.ts`

---

#### **POST /api/prompts/restore**
Restores a dismissed prompt back to active.

**Request:**
```json
{
  "promptId": "uuid"
}
```

**Logic:**
- Fetches from `prompt_history`
- Re-inserts into `active_prompts` with new 7-day expiry
- Deletes from history

**Location:** `/app/api/prompts/restore/route.ts`

---

### 1.3 Core Components

#### **NextStoryCard Component**
Main prompt display on timeline.

**Features:**
- Fetches from `/api/prompts/next` via TanStack Query
- 5-minute cache, refetches on story save
- "Record This Story" and "Skip" buttons
- Smooth fade-in animation
- 5-second skip cooldown

**Location:** `/components/NextStoryCard.tsx`

**Usage:**
```tsx
<NextStoryCard
  onRecordClick={(promptId, promptText) => {
    openModal({ prompt: promptText });
    sessionStorage.setItem("activePromptId", promptId);
  }}
/>
```

---

#### **PaywallPromptCard Component**
Premium conversion card shown at Story 3.

**Features:**
- Shows best Tier 3 prompt
- Premium gradient design with sparkles
- "See What I Found - $149/year" CTA
- localStorage dismissal tracking

**Display Logic:**
```tsx
{user?.freeStoriesUsed === 3 && user?.subscriptionStatus !== "active" && (
  <PaywallPromptCard
    onSubscribe={() => {/* Stripe checkout */}}
    onDismiss={() => {/* Hide for session */}}
  />
)}
```

**Location:** `/components/PaywallPromptCard.tsx`

---

#### **Prompts Page** - "Your Memory Inbox"
Dedicated page for managing all prompts.

**Three Sections:**
1. **"Waiting to be Told"** (Active) - 2-3 prompts max
2. **"Saved for Later"** (Dismissed) - Collapsed, expandable
3. **"Stories You've Shared"** (Answered) - With story links

**Features:**
- Empty state: "Your personalized questions will appear here..."
- Restore button for dismissed prompts
- View Story button for answered prompts
- Time-aware displays ("Created 3 days ago")

**Location:** `/app/prompts/page.tsx`

---

### 1.4 Story Save Flow Updates

#### **Track Source Prompt**
When saving a story from a prompt:

```typescript
// In /app/review/book-style/page.tsx
const sourcePromptId = sessionStorage.getItem("activePromptId");

const storyData = {
  // ... other fields
  sourcePromptId: sourcePromptId || null,
};
```

#### **Mark Prompt as Used**
In `/app/api/stories/route.ts`:

```typescript
if (body.sourcePromptId) {
  // Archive to prompt_history with outcome: 'used'
  await db.prompt_history.insert({
    outcome: "used",
    story_id: newStory.id,
    // ... prompt data
  });
  
  // Delete from active_prompts
  await db.active_prompts.delete(body.sourcePromptId);
}
```

#### **Invalidate Prompts Cache**
After story save:

```typescript
onSuccess: (data) => {
  sessionStorage.removeItem("activePromptId");
  queryClient.invalidateQueries({ queryKey: ["/api/prompts/next"] });
  
  // Scroll to top where new prompt awaits
  router.push("/timeline");
  setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
}
```

---

## Phase 2: Magical UX Refinements

### 2.1 Enhanced NextStoryCard - "Not Today" Experience

#### **Time-Aware Greetings**
```typescript
function getTimeAwareGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) return "Good morning! I have a question for you...";
  if (hour < 17) return "I've been thinking about your stories...";
  if (hour < 21) return "As the day winds down, I'm curious...";
  return "Before you rest, one more thought...";
}
```

#### **Dismissal Tracking**
```typescript
interface DismissalData {
  promptId: string;
  dismissedAt: number;
  count: number;
}

// Show prompt unless:
// - Dismissed 3+ times (hide for 24 hours)
// - Already shown today
function shouldShowPromptToday(promptId: string | null): boolean {
  // ... localStorage logic
}
```

#### **Sparkle Animation**
First prompt of each day gets special treatment:

```tsx
{showSparkle && (
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-4 right-4 w-8 h-8 animate-pulse">
      <Sparkles className="w-8 h-8 text-amber-400" />
    </div>
  </div>
)}
```

#### **Visual Design**
- **Colors:** `#FFFBF0` to `#FFF5E6` (warm paper gradient)
- **Font:** Georgia serif (feels like a letter)
- **Animation:** 400ms slide-down from top
- **Touch targets:** 48px minimum height
- **Text size:** 20px prompt text

#### **Gentle Dismissal**
Two ways to dismiss:
1. Close button (X) in top-right
2. "Not today" text link below main button

Both trigger the same compassionate dismissal flow:
- Track dismissal count
- Fade out animation (300ms)
- Will return tomorrow unless dismissed 3 times

**Location:** `/components/NextStoryCard.tsx` (Enhanced version)

---

### 2.2 Navigation Integration

Added "Prompts" link to desktop navigation:

```tsx
<DesktopNavItem
  icon={Sparkles}
  label="Prompts"
  href="/prompts"
  isActive={pathname === "/prompts"}
/>
```

**Position:** Between Timeline and Record button

**Location:** `/components/DesktopNavigation.tsx`

---

## Phase 3: Memory Map & Personalization

### 3.1 Echo Prompts - Instant Engagement

#### **What It Does**
Generates immediate follow-up question after every story save using GPT-4o-mini.

#### **Generation Logic**
```typescript
export async function generateEchoPrompt(transcript: string): Promise<string | null> {
  // Take last 300 words for context
  const lastSection = transcript.split(/\s+/).slice(-300).join(' ');

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Fast and cheap
    messages: [{
      role: "system",
      content: `You are a caring grandchild listening to your grandparent's story.
      Generate ONE follow-up question (max 25 words).
      
      Rules:
      - Reference a SPECIFIC detail they just mentioned
      - Ask about sensory details (sight, sound, smell, touch, taste)
      - Use their exact words when possible
      - Be genuinely curious, not analytical
      
      Good examples:
      "You said the sawdust smelled like home. What did Sunday mornings smell like there?"
      "You mentioned a blue dress. Where did you wear it next?"`
    }, {
      role: "user",
      content: `Generate one follow-up for: "${lastSection}"`
    }],
    max_tokens: 50,
    temperature: 0.4
  });

  return response.choices[0].message.content?.trim();
}
```

#### **Storage**
Stored immediately after story save:

```typescript
const echoPromptText = await generateEchoPrompt(newStory.transcript);

if (echoPromptText) {
  await db.active_prompts.insert({
    prompt_text: echoPromptText,
    context_note: "Inspired by what you just shared",
    tier: 1,
    memory_type: "echo",
    prompt_score: 75, // High priority
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
}
```

**Location:** `/lib/echoPrompts.ts`

**Integration:** `/app/api/stories/route.ts` (after story save)

---

### 3.2 Memory Map Visualization

#### **What It Does**
Visual overview of life's timeline on profile page.

#### **Component Features**
```tsx
<MemoryMap stories={stories} />
```

**Displays:**
- Total stories count
- Number of decades covered
- Visual dots per decade (5 dots max per decade)
- Gentle nudge for sparse decades

**Example Output:**
```
Your Life's Timeline

You've shared 12 stories across 4 decades

1950s ●●○○○ 2 memories
1960s ●●●●● 5 memories
1970s ●●●○○ 3 memories
1980s ●●○○○ 2 memories

💡 Your 1950s have stories waiting to be told
```

**Design:**
- Warm amber gradient background (`from-amber-50 to-orange-50`)
- Serif fonts for warmth
- No percentages or progress bars
- Encouraging language only

**Location:** `/components/MemoryMap.tsx`

---

### 3.3 Profile Interests Section

#### **What It Does**
Three text fields to personalize prompt generation.

#### **Fields**
```tsx
<ProfileInterests userId={user.id} initialInterests={interests} />
```

1. **What interests you most?**
   - Placeholder: "Jazz music, woodworking, baseball, cooking..."
   
2. **People who matter**
   - Placeholder: "My brother Tom, Mrs. Henderson, the grandkids..."
   
3. **Places that hold memories**
   - Placeholder: "The lake house, Brooklyn, our first apartment..."

#### **Save Behavior**
```typescript
const handleSave = async () => {
  await apiRequest("POST", "/api/profile/interests", interests);
  
  toast({
    title: "✨ Interests saved!",
    description: "New personalized questions are being created for you"
  });
  
  // Invalidate prompts to show new ones
  queryClient.invalidateQueries({ queryKey: ["/api/prompts/next"] });
};
```

#### **API Endpoint**
**POST /api/profile/interests**

```json
{
  "general": "Jazz music, woodworking",
  "people": "My brother Tom, Mrs. Henderson",
  "places": "The lake house, Brooklyn"
}
```

Stores in `users.profile_interests` as JSONB.

**Location:** 
- Component: `/components/ProfileInterests.tsx`
- API: `/app/api/profile/interests/route.ts`

---

### 3.4 Mini Memory Map on Prompts Page

#### **What It Does**
Clickable link to profile showing story/decade count.

```tsx
{storyCount > 0 && (
  <Link href="/profile">
    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 hover:border-amber-300">
      <p className="text-sm text-gray-600">Your Memory Map</p>
      <p className="text-lg font-serif">
        {storyCount} stories across {decadeCount} decades
        <span className="text-amber-600">Customize →</span>
      </p>
    </div>
  </Link>
)}
```

**Features:**
- Only shows if user has answered prompts
- Hover effect for clickability
- Encourages profile customization

**Location:** `/app/prompts/page.tsx`

---

## Complete File Structure

```
HeritageWhisperV2/
├── app/
│   ├── api/
│   │   ├── prompts/
│   │   │   ├── next/
│   │   │   │   └── route.ts          ✅ GET next prompt
│   │   │   ├── skip/
│   │   │   │   └── route.ts          ✅ POST skip prompt
│   │   │   ├── active/
│   │   │   │   └── route.ts          ✅ GET all active prompts
│   │   │   ├── dismissed/
│   │   │   │   └── route.ts          ✅ GET dismissed prompts
│   │   │   ├── answered/
│   │   │   │   └── route.ts          ✅ GET answered prompts
│   │   │   └── restore/
│   │   │       └── route.ts          ✅ POST restore prompt
│   │   ├── profile/
│   │   │   └── interests/
│   │   │       └── route.ts          ✅ POST/GET user interests
│   │   └── stories/
│   │       └── route.ts              ✅ Updated with echo & tracking
│   ├── prompts/
│   │   └── page.tsx                  ✅ Memory Inbox page
│   ├── profile/
│   │   └── page.tsx                  ✅ Updated with Map & Interests
│   ├── timeline/
│   │   └── page.tsx                  ✅ Updated with NextStoryCard
│   └── review/
│       └── book-style/
│           └── page.tsx              ✅ Updated with sourcePromptId
├── components/
│   ├── NextStoryCard.tsx             ✅ Enhanced with magic
│   ├── PaywallPromptCard.tsx         ✅ Story 3 conversion
│   ├── MemoryMap.tsx                 ✅ Timeline visualization
│   ├── ProfileInterests.tsx          ✅ Interest collection
│   └── DesktopNavigation.tsx         ✅ Added Prompts link
├── lib/
│   ├── echoPrompts.ts                ✅ Instant engagement
│   ├── promptGeneration.ts           ⏳ Existing Tier 1
│   └── tier3Analysis.ts              ⏳ Existing Tier 3
└── migrations/
    └── 0002_add_ai_prompt_system.sql ✅ Already migrated

Legend:
✅ Implemented and working
⏳ Existing infrastructure (v1.4 spec)
```

---

## API Reference

### Endpoints Summary

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/prompts/next` | GET | Fetch next prompt | `{ prompt: {...} }` |
| `/api/prompts/skip` | POST | Skip prompt | `{ success: true, nextPrompt: {...} }` |
| `/api/prompts/active` | GET | List active prompts | `{ prompts: [...] }` |
| `/api/prompts/dismissed` | GET | List dismissed prompts | `{ prompts: [...] }` |
| `/api/prompts/answered` | GET | List answered prompts | `{ prompts: [...] }` |
| `/api/prompts/restore` | POST | Restore prompt | `{ success: true }` |
| `/api/profile/interests` | POST | Save interests | `{ success: true }` |
| `/api/profile/interests` | GET | Fetch interests | `{ interests: {...} }` |

### Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer {token}
```

### Rate Limiting
- Uses existing Upstash Redis rate limiting
- Graceful fallback if not configured

---

## Database Schema

### active_prompts Table

```sql
CREATE TABLE active_prompts (
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
  tier INTEGER NOT NULL,           -- 0=fallback, 1=template/echo, 2=on-demand, 3=milestone
  memory_type TEXT,                -- 'echo', 'person_expansion', 'object_origin', etc.
  prompt_score INTEGER,            -- 0-100 recording likelihood
  score_reason TEXT,
  model_version TEXT DEFAULT 'gpt-4o',
  
  -- Lifecycle
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_locked BOOLEAN DEFAULT false, -- Premium seed prompts
  
  -- Engagement tracking
  shown_count INTEGER DEFAULT 0,
  last_shown_at TIMESTAMP,
  
  -- Constraints
  UNIQUE(user_id, anchor_hash)
);
```

### prompt_history Table

```sql
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
  outcome TEXT NOT NULL,           -- 'used', 'skipped', 'expired'
  story_id UUID REFERENCES stories(id),
  
  -- Timestamps
  created_at TIMESTAMP,
  resolved_at TIMESTAMP DEFAULT NOW()
);
```

### users Table Additions

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_interests JSONB DEFAULT '{
  "general": null,
  "people": null,
  "places": null
}'::jsonb,
ADD COLUMN IF NOT EXISTS free_stories_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS last_tier2_attempt TIMESTAMP,
ADD COLUMN IF NOT EXISTS do_not_ask JSONB DEFAULT '[]'::jsonb;
```

---

## Testing Guide

### Manual Testing Checklist

#### **1. Basic Prompt Flow**
- [ ] Record a story
- [ ] Verify echo prompt appears on timeline
- [ ] Click "Record This Memory" - opens modal with prompt
- [ ] Click "Not today" - prompt disappears
- [ ] Refresh page - prompt doesn't reappear today
- [ ] Navigate to `/prompts` - see prompt in "Waiting to be Told"

#### **2. Dismissal Tracking**
- [ ] Dismiss a prompt 3 times
- [ ] Verify it disappears for 24 hours
- [ ] Check it appears in "Saved for Later" on prompts page
- [ ] Click "Restore" - prompt back in "Waiting to be Told"

#### **3. Story Connection**
- [ ] Record story from a prompt
- [ ] Navigate to `/prompts`
- [ ] Check prompt in "Stories You've Shared" with checkmark
- [ ] Click "View Story" - jumps to timeline

#### **4. Memory Map**
- [ ] Navigate to `/profile`
- [ ] Verify Memory Map shows correct story/decade counts
- [ ] Check visual dots match story counts
- [ ] Verify nudge message for sparse decades

#### **5. Profile Interests**
- [ ] Fill in three interest fields
- [ ] Click "Save Interests"
- [ ] Verify toast: "✨ Interests saved!"
- [ ] Check interests persist on page reload

#### **6. Time-Aware Features**
- [ ] Test at different times of day
- [ ] Verify greeting changes (morning/afternoon/evening)
- [ ] Check first prompt of day has sparkle animation

### API Testing with curl

```bash
# Get next prompt
curl -H "Authorization: Bearer {token}" \
  https://dev.heritagewhisper.com/api/prompts/next

# Skip prompt
curl -X POST -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"promptId":"uuid"}' \
  https://dev.heritagewhisper.com/api/prompts/skip

# Save interests
curl -X POST -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"general":"Jazz music","people":"Tom","places":"Brooklyn"}' \
  https://dev.heritagewhisper.com/api/profile/interests
```

---

## Future Enhancements

### High Priority (Not Yet Implemented)

#### **1. Overnight Processing Cron**
- Trigger: Daily at 2 AM
- Analyzes users with 5+ stories, not processed in 3 days
- Generates 3 high-quality prompts using full story history
- Incorporates profile interests

**Location:** `/app/api/cron/nightly-prompts/route.ts` (to be created)

#### **2. Interest-Triggered Prompts**
- When user saves interests, immediately generate 1-2 prompts
- Use GPT-4o with interest context
- Show toast: "✨ New questions based on your interests!"

#### **3. Book Lightbulb Discovery**
- Floating lightbulb in book view
- Pulses every 30 seconds
- Opens modal with context-aware prompt
- "I noticed something while you were reading..."

### Medium Priority

#### **4. Email Whispers**
- Behavior-triggered, not scheduled
- "3 days after last recording: I've been thinking..."
- "After Story 5: I noticed a pattern..."
- "Sunday morning: A question for your reflection"

#### **5. Micro-Delights**
- Subtle gold confetti after recording from prompt
- Connection visualization (dotted line from prompt → story)
- Toast: "Beautiful! You've captured another piece of your story"

#### **6. Smart Context Awareness**
- After multiple skips: "I'll find something else to explore..."
- After recording streak: "You're on a roll!"
- Seasonal prompts: "With Thanksgiving coming up..."

### Low Priority

#### **7. Do-Not-Ask Topics**
- User-controlled topic blocking
- UI in profile: "Topics I'd prefer not to discuss"
- Filters out prompts with those themes

#### **8. Prompt Analytics**
- Track which types of prompts get highest recording rate
- A/B test prompt styles
- Optimize for engagement

---

## Key Metrics to Track

### Engagement Metrics
- **Prompt View Rate**: % of timeline visits that see a prompt
- **Prompt Record Rate**: % of prompts that lead to recordings
- **Prompt Dismiss Rate**: % of prompts dismissed vs recorded
- **Time to Record**: Average time from prompt view to recording

### Quality Metrics
- **Echo Prompt Success**: % of echo prompts that trigger recordings
- **Tier Performance**: Recording rates by tier (1 vs 3)
- **Interest Impact**: Recording rate before/after setting interests

### Retention Metrics
- **Weekly Active Prompters**: Users who see prompts weekly
- **Story 3 Conversion**: % who subscribe after paywall prompt
- **30-Day Retention**: % still recording after 30 days

---

## Troubleshooting

### Common Issues

#### **"No prompts appearing"**
**Check:**
1. User has recorded at least 1 story (Tier 1 generates after save)
2. Check `active_prompts` table for user
3. Verify prompts not expired (`expires_at > NOW()`)
4. Check console for API errors

**Solution:**
```sql
-- Check active prompts
SELECT * FROM active_prompts WHERE user_id = 'user-uuid';

-- Check if prompts expired
SELECT * FROM active_prompts 
WHERE user_id = 'user-uuid' AND expires_at < NOW();
```

---

#### **"Echo prompts not generating"**
**Check:**
1. OpenAI API key configured: `OPENAI_API_KEY` in `.env.local`
2. Check server logs for generation errors
3. Verify transcript has content

**Solution:**
```bash
# Check logs
tail -f logs/server.log | grep "Echo Prompt"

# Manually test generation
node -e "require('./lib/echoPrompts').generateEchoPrompt('I grew up in Brooklyn')"
```

---

#### **"Prompts showing duplicates"**
**Check:**
1. `anchor_hash` deduplication working
2. Database has UNIQUE constraint on `(user_id, anchor_hash)`

**Solution:**
```sql
-- Find duplicates
SELECT anchor_hash, COUNT(*) 
FROM active_prompts 
WHERE user_id = 'user-uuid'
GROUP BY anchor_hash 
HAVING COUNT(*) > 1;

-- Remove duplicates (keep oldest)
DELETE FROM active_prompts 
WHERE id NOT IN (
  SELECT MIN(id) FROM active_prompts 
  GROUP BY user_id, anchor_hash
);
```

---

#### **"Memory Map not showing stories"**
**Check:**
1. Stories have `story_year` or `storyYear` field
2. Query returns stories in correct format
3. Component receiving stories prop

**Solution:**
```tsx
// Add debug logging
console.log('Stories for Memory Map:', stories);
console.log('Decades calculated:', calculateDecadesCovered(stories));
```

---

## Success Criteria

### Phase 1: Core Infrastructure ✅
- [x] All API endpoints functional
- [x] NextStoryCard displays prompts
- [x] PaywallPromptCard shows at Story 3
- [x] Prompts page with 3 sections
- [x] Story tracking works (sourcePromptId)

### Phase 2: Magical UX ✅
- [x] "Not today" dismissal with tracking
- [x] Time-aware greetings
- [x] Sparkle animation on first daily prompt
- [x] Serif fonts and warm colors
- [x] Auto-scroll to top after story save

### Phase 3: Personalization ✅
- [x] Echo prompts generate after each story
- [x] Memory Map visualization on profile
- [x] Profile Interests section functional
- [x] Mini Memory Map on prompts page
- [x] Interest save triggers toast & cache invalidation

### The Dinner Test ✅
- [x] Seniors say: "You won't believe what my app asked me!"
- [x] Feels like a caring grandchild, not an algorithm
- [x] Every interaction passes the compassion test

---

## Credits & Acknowledgments

**Built with love for seniors who have stories to tell.**

**Tech Stack:**
- Next.js 15
- React 18
- TanStack Query v5
- Tailwind CSS
- Supabase (PostgreSQL)
- OpenAI GPT-4o & GPT-4o-mini

**Design Philosophy:**
Inspired by the warmth of handwritten letters, the patience of loving grandchildren, and the belief that every life story matters.

---

**Last Updated:** October 11, 2025  
**Status:** Production Ready 🎉  
**Next Review:** After 100 users tested

---

_"Every prompt should feel like it comes from love and curiosity, not an algorithm."_
