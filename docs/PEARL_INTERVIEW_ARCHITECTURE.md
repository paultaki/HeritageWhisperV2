# Pearl Interview System: Architecture & Implementation Plan

> **Version:** 1.0
> **Created:** December 11, 2025
> **Status:** Reference Document for Development

---

## Executive Summary

Pearl is HeritageWhisper's AI interviewer that conducts flowing voice conversations with seniors using OpenAI's Realtime API (WebRTC). The core connection is working. This document addresses **the output problem**: transforming a 15-40 minute raw interview into polished, individual stories that fit the existing Timeline and Book views.

### The Vision

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER JOURNEY                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. INTERVIEW          2. PARSE              3. REVIEW              │
│  ┌─────────────┐      ┌─────────────┐       ┌─────────────┐        │
│  │   Pearl     │      │  AI finds   │       │  User sees  │        │
│  │ conversation│  →   │  3-6 story  │   →   │ "5 stories  │        │
│  │  (25 min)   │      │  segments   │       │  found"     │        │
│  └─────────────┘      └─────────────┘       └─────────────┘        │
│        ↓                    ↓                     ↓                 │
│  Master audio +       Timestamps +          Edit titles,            │
│  full transcript      bridged text          add photos              │
│                                                   ↓                 │
│                                            4. SAVE                  │
│                                            ┌─────────────┐          │
│                                            │ Individual  │          │
│                                            │  stories    │  → Timeline
│                                            │  created    │  → Book View
│                                            └─────────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Key principle:** The interview is raw material. Individual stories are the product.

---

## Part 1: Current State Analysis

### 1.1 Existing Data Model

#### Stories Table (Primary - `shared/schema.ts:186-296`)

| Field | Type | Purpose |
|-------|------|---------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner |
| `title` | text | Story headline |
| `audio_url` | text | Supabase Storage URL |
| `transcription` | text | Full text |
| `duration_seconds` | int | Audio length (1-600s) |
| `story_year` | int | Year memory occurred (nullable) |
| `story_date` | timestamp | Full date (optional) |
| `life_phase` | text | 'childhood', 'teen', 'early_adult', etc. |
| `photos` | jsonb[] | Photo array with WebP paths |
| `lesson_learned` | text | AI-extracted wisdom |
| `source_prompt_id` | uuid | Which prompt triggered this |
| `include_in_book` | bool | Export to PDF |
| `include_in_timeline` | bool | Show in Timeline |
| `created_at` | timestamp | Record creation |

**Gap:** No field to link stories back to a source interview.

#### Interview Drafts Table (Exists - auto-save)

| Field | Type | Purpose |
|-------|------|---------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner |
| `transcript_json` | jsonb | Message array from chat |
| `theme` | text | Selected interview theme |
| `session_duration` | int | Seconds |
| `updated_at` | timestamp | Auto-save timestamp |

**Gap:** Only stores in-progress interviews. Deleted after completion.

### 1.2 Existing Audio Handling

| Aspect | Implementation |
|--------|----------------|
| **Format** | WebM Opus (48kHz) via MediaRecorder |
| **Storage** | Supabase Storage: `audio/{userId}/{timestamp}-recording.webm` |
| **Max Size** | 25MB (OpenAI Whisper limit) |
| **Recording** | `userOnlyRecorder` (mic only) + `mixedRecorder` (mic + Pearl) |
| **Playback** | HTML5 `<audio>` with custom controls |
| **Transcription** | OpenAI Whisper-1 (built into Realtime API) |

**Key Insight:** The `userOnlyRecorder` in `use-realtime-interview.tsx` already captures just the user's voice - exactly what we need for story segments.

### 1.3 Existing Story Analysis (`/api/analyze-stories`)

The endpoint already exists and returns:

```typescript
{
  stories: [
    {
      title: "Summer at Grandma's Farm",
      summary: "A childhood memory of summer visits...",
      bridged_text: "The farm was about 50 miles outside Chicago...",
      start_time: 0,      // seconds
      end_time: 180,      // seconds
      reasoning: "Natural topic transition when user shifted to school memories"
    },
    // ... more stories
  ]
}
```

**Gap:** `start_time` and `end_time` are placeholders - the current transcript doesn't include real timestamps.

### 1.4 Current Interview Flow End

When user clicks "Done" in `/app/interview-chat-v2/page.tsx`:

1. Calls `/api/analyze-stories` with transcript
2. If 1 story → Creates single story via `POST /api/stories`
3. If >1 stories → Shows `StorySplitModal` (exists but incomplete)
4. Redirects to Timeline

**Gap:** No intermediate review screen. No audio slicing. No photo/date editing per story.

---

## Part 2: Proposed Data Model Changes

### 2.1 New Table: `interviews` (Master Archive)

```sql
CREATE TABLE interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Audio artifacts
  full_audio_url TEXT NOT NULL,           -- Complete interview audio (user only)
  mixed_audio_url TEXT,                    -- Optional: user + Pearl combined
  duration_seconds INTEGER NOT NULL,

  -- Transcript with timestamps
  transcript_json JSONB NOT NULL,          -- Array of {speaker, text, start_ms, end_ms}

  -- Metadata
  theme TEXT,                              -- Interview theme ID
  status TEXT DEFAULT 'completed',         -- 'completed', 'processing', 'archived'

  -- AI analysis results
  detected_stories JSONB,                  -- Raw output from /api/analyze-stories
  stories_parsed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX idx_interviews_user_id ON interviews(user_id);

-- RLS policy
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own interviews"
  ON interviews FOR ALL
  USING (auth.uid() = user_id);
```

### 2.2 Extend `stories` Table

Add columns to link back to source interview:

```sql
ALTER TABLE stories ADD COLUMN source_interview_id UUID
  REFERENCES interviews(id) ON DELETE SET NULL;

ALTER TABLE stories ADD COLUMN interview_start_ms INTEGER;
ALTER TABLE stories ADD COLUMN interview_end_ms INTEGER;

-- For age-based dating (seniors remember "I was about 10" easier than "1957")
ALTER TABLE stories ADD COLUMN story_age INTEGER;  -- Age at time of story

-- Index for interview lookup
CREATE INDEX idx_stories_source_interview ON stories(source_interview_id);
```

### 2.3 Updated Transcript Format

Current format (chat messages):
```json
[
  {"sender": "hw", "content": "Tell me about your childhood"},
  {"sender": "user", "content": "I grew up on a farm..."}
]
```

New format (with timestamps):
```json
{
  "messages": [
    {
      "id": "msg-1",
      "sender": "hw",
      "content": "Tell me about your childhood",
      "timestamp_ms": 0,
      "duration_ms": 3200
    },
    {
      "id": "msg-2",
      "sender": "user",
      "content": "I grew up on a farm outside Chicago...",
      "timestamp_ms": 3500,
      "duration_ms": 45000
    }
  ],
  "total_duration_ms": 1500000,
  "recorded_at": "2025-12-11T10:30:00Z"
}
```

---

## Part 3: Processing Pipeline

### 3.1 Complete Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                     INTERVIEW COMPLETION FLOW                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [User clicks "Finish Interview"]                                      │
│              │                                                         │
│              ▼                                                         │
│  ┌─────────────────────┐                                              │
│  │  1. COLLECT DATA    │                                              │
│  │  • Stop recorders   │                                              │
│  │  • Get user audio   │                                              │
│  │  • Get mixed audio  │                                              │
│  │  • Get transcript   │                                              │
│  └──────────┬──────────┘                                              │
│             │                                                          │
│             ▼                                                          │
│  ┌─────────────────────┐                                              │
│  │  2. UPLOAD MASTER   │                                              │
│  │  POST /api/upload/  │                                              │
│  │  interview-audio    │                                              │
│  │  → Returns URLs     │                                              │
│  └──────────┬──────────┘                                              │
│             │                                                          │
│             ▼                                                          │
│  ┌─────────────────────┐                                              │
│  │  3. CREATE RECORD   │                                              │
│  │  POST /api/         │                                              │
│  │  interviews         │                                              │
│  │  → Returns ID       │                                              │
│  └──────────┬──────────┘                                              │
│             │                                                          │
│             ▼                                                          │
│  ┌─────────────────────┐      ┌─────────────────────┐                 │
│  │  4. ANALYZE         │      │  Show "Analyzing    │                 │
│  │  POST /api/         │ ──── │  your conversation" │                 │
│  │  analyze-stories    │      │  loading screen     │                 │
│  └──────────┬──────────┘      └─────────────────────┘                 │
│             │                                                          │
│             ▼                                                          │
│      ┌──────────────┐                                                  │
│      │ stories > 1? │                                                  │
│      └──────┬───────┘                                                  │
│             │                                                          │
│    ┌────────┴────────┐                                                │
│    │                 │                                                 │
│    ▼                 ▼                                                 │
│  [YES]             [NO]                                                │
│    │                 │                                                 │
│    ▼                 ▼                                                 │
│  ┌─────────────┐  ┌─────────────┐                                     │
│  │ 5a. SLICE   │  │ 5b. SINGLE  │                                     │
│  │ AUDIO       │  │ STORY MODE  │                                     │
│  │ Server-side │  │ Full audio  │                                     │
│  │ FFmpeg      │  │ = 1 story   │                                     │
│  └──────┬──────┘  └──────┬──────┘                                     │
│         │                │                                             │
│         └───────┬────────┘                                             │
│                 ▼                                                       │
│  ┌─────────────────────┐                                              │
│  │  6. STORY REVIEW    │                                              │
│  │  /review/interview  │                                              │
│  │  • Edit titles      │                                              │
│  │  • Add photos       │                                              │
│  │  • Set dates/ages   │                                              │
│  │  • Play segments    │                                              │
│  └──────────┬──────────┘                                              │
│             │                                                          │
│             ▼                                                          │
│  ┌─────────────────────┐                                              │
│  │  7. SAVE APPROVED   │                                              │
│  │  POST /api/stories  │                                              │
│  │  (for each story)   │                                              │
│  └──────────┬──────────┘                                              │
│             │                                                          │
│             ▼                                                          │
│  ┌─────────────────────┐                                              │
│  │  8. REDIRECT        │                                              │
│  │  → Timeline         │                                              │
│  │  "5 stories saved!" │                                              │
│  └─────────────────────┘                                              │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Audio Slicing Approach

**Recommendation: Server-side FFmpeg via Edge Function**

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Client-side Web Audio API** | No server cost | Complex, browser limitations, memory issues with long audio | ❌ |
| **External service (Auphonic)** | Already integrated | Expensive per-minute, adds latency | ❌ |
| **Supabase Edge Function + FFmpeg** | Fast, cheap, reliable | Needs deployment | ✅ **Recommended** |
| **Vercel Serverless + FFmpeg** | Familiar stack | 10s timeout on hobby, 60s on Pro | ⚠️ Backup |

**Implementation: Supabase Edge Function**

```typescript
// supabase/functions/slice-audio/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  const { audioUrl, segments } = await req.json();

  // segments: [{ start_ms: 0, end_ms: 180000, story_id: "..." }, ...]

  // Download source audio
  const audioResponse = await fetch(audioUrl);
  const audioBuffer = await audioResponse.arrayBuffer();

  // Use Deno FFmpeg bindings to slice
  // Each segment becomes its own file

  // Upload sliced files to Supabase Storage
  // Return URLs for each segment

  return new Response(JSON.stringify({
    sliced_urls: ["url1", "url2", "url3"]
  }));
});
```

**Fallback for Single Story:** If only 1 story detected, skip slicing entirely - use the full user audio.

---

## Part 4: API Endpoints

### 4.1 New Endpoints Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/interviews` | POST | Create interview record with audio URLs |
| `/api/interviews` | GET | Fetch user's interviews (for history view) |
| `/api/interviews/[id]` | GET | Get single interview details |
| `/api/interviews/[id]/stories` | POST | Save approved stories from review |
| `/api/upload/interview-audio` | POST | Upload interview audio files |
| `/api/slice-audio` | POST | Trigger audio slicing (calls Edge Function) |

### 4.2 Updated Endpoint: `/api/analyze-stories`

Current input:
```json
{ "transcript": "...", "userName": "..." }
```

Updated input (with timestamps):
```json
{
  "transcript": {
    "messages": [...],  // With timestamp_ms
    "total_duration_ms": 1500000
  },
  "userName": "Grandma Rose"
}
```

Updated output:
```json
{
  "stories": [
    {
      "title": "Summer at Grandma's Farm",
      "summary": "A childhood memory of summer visits...",
      "bridged_text": "The farm was about 50 miles outside Chicago...",
      "start_ms": 0,
      "end_ms": 180000,
      "life_phase": "childhood",
      "suggested_age": 8,          // NEW: If mentioned
      "suggested_year": null,      // NEW: If mentioned
      "people_mentioned": ["Grandma Rose", "Uncle Bob"],  // NEW
      "places_mentioned": ["Chicago", "the farm"],        // NEW
      "reasoning": "Natural topic transition..."
    }
  ],
  "metadata": {
    "total_stories": 3,
    "total_duration_ms": 1500000,
    "confidence": 0.85
  }
}
```

### 4.3 POST `/api/interviews`

```typescript
// Request
{
  "fullAudioUrl": "https://...",
  "mixedAudioUrl": "https://...",  // optional
  "durationSeconds": 1500,
  "transcriptJson": { ... },
  "theme": "childhood"
}

// Response
{
  "id": "interview-uuid",
  "status": "completed"
}
```

### 4.4 POST `/api/interviews/[id]/stories`

```typescript
// Request - batch create stories from review
{
  "stories": [
    {
      "title": "Summer at the Farm",
      "transcription": "The farm was about 50 miles...",
      "audioUrl": "https://... (sliced)",
      "durationSeconds": 180,
      "storyYear": 1965,
      "storyAge": 8,           // Alternative to year
      "lifePhase": "childhood",
      "photos": [{ "filePath": "...", "isHero": true }],
      "interviewStartMs": 0,
      "interviewEndMs": 180000
    },
    // ... more stories
  ]
}

// Response
{
  "created": 3,
  "stories": [
    { "id": "story-1", "title": "Summer at the Farm" },
    { "id": "story-2", "title": "First Day of School" },
    { "id": "story-3", "title": "Meeting Your Grandfather" }
  ]
}
```

---

## Part 5: Story Review Screen Design

### 5.1 Page Location

`/app/review/interview/page.tsx` (new)

Accessed via: `/review/interview?id={interviewId}`

### 5.2 Component Structure

```
┌────────────────────────────────────────────────────────────────┐
│  InterviewReviewPage                                           │
│  ├── Header                                                    │
│  │   └── "We found X stories in your interview"               │
│  │                                                             │
│  ├── StoryCardsContainer (scrollable)                         │
│  │   ├── StoryReviewCard [1]                                  │
│  │   │   ├── TitleInput (editable)                            │
│  │   │   ├── AudioSegmentPlayer (with timestamp display)      │
│  │   │   ├── PhotoUploadArea (drag & drop)                    │
│  │   │   ├── DateOrAgeSelector                                │
│  │   │   │   ├── "When did this happen?"                      │
│  │   │   │   ├── YearPicker OR AgePicker toggle               │
│  │   │   │   └── "I don't remember" option                    │
│  │   │   ├── TranscriptPreview (collapsible)                  │
│  │   │   └── Actions: [Include] [Skip] [Edit More]            │
│  │   │                                                         │
│  │   ├── StoryReviewCard [2]                                  │
│  │   └── StoryReviewCard [3]                                  │
│  │                                                             │
│  ├── FullInterviewPlayer (collapsed by default)               │
│  │   └── "Listen to full interview"                           │
│  │                                                             │
│  └── Footer                                                    │
│      ├── "Save X Stories" (primary, 60px)                     │
│      └── "Save as Single Story" (secondary, for fallback)     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 5.3 StoryReviewCard Component

```tsx
interface StoryReviewCardProps {
  index: number;
  story: {
    id: string;
    title: string;
    bridgedText: string;
    audioUrl: string;          // Sliced segment
    durationSeconds: number;
    startMs: number;
    endMs: number;
    suggestedYear?: number;
    suggestedAge?: number;
    lifePhase?: string;
  };
  onUpdate: (id: string, updates: Partial<Story>) => void;
  onSkip: (id: string) => void;
}

function StoryReviewCard({ story, index, onUpdate, onSkip }: StoryReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isIncluded, setIsIncluded] = useState(true);

  return (
    <div className={`
      rounded-2xl border-2 p-6 mb-4
      ${isIncluded
        ? 'border-[var(--hw-primary)] bg-white'
        : 'border-gray-200 bg-gray-50 opacity-60'}
    `}>
      {/* Story number badge */}
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-8 rounded-full bg-[var(--hw-primary)] text-white
                         flex items-center justify-center text-sm font-semibold">
          {index + 1}
        </span>
        <span className="text-sm text-[var(--hw-text-muted)]">
          {formatDuration(story.durationSeconds)}
        </span>
      </div>

      {/* Editable title */}
      <input
        type="text"
        value={story.title}
        onChange={(e) => onUpdate(story.id, { title: e.target.value })}
        className="text-xl font-semibold w-full border-0 border-b-2
                   border-transparent focus:border-[var(--hw-primary)]
                   bg-transparent p-0 mb-4"
        placeholder="Story title..."
      />

      {/* Audio player for this segment */}
      <AudioSegmentPlayer
        url={story.audioUrl}
        duration={story.durationSeconds}
        className="mb-4"
      />

      {/* Photo upload */}
      <PhotoUploadArea
        photos={story.photos || []}
        onPhotosChange={(photos) => onUpdate(story.id, { photos })}
        maxPhotos={3}
        className="mb-4"
      />

      {/* Date or Age selector */}
      <DateOrAgeSelector
        year={story.storyYear}
        age={story.storyAge}
        lifePhase={story.lifePhase}
        userBirthYear={userBirthYear}
        onChange={(values) => onUpdate(story.id, values)}
        className="mb-4"
      />

      {/* Transcript preview */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-[var(--hw-text-secondary)] flex items-center gap-2"
      >
        {isExpanded ? 'Hide' : 'Show'} transcript
        <ChevronDown className={`w-4 h-4 transition ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="mt-3 p-4 bg-[var(--hw-section-bg)] rounded-xl text-base leading-relaxed">
          {story.bridgedText}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--hw-border-subtle)]">
        <button
          onClick={() => {
            setIsIncluded(!isIncluded);
            onSkip(story.id);
          }}
          className="min-h-[48px] px-4 py-2 text-[var(--hw-text-secondary)]
                     hover:text-[var(--hw-error)]"
        >
          {isIncluded ? 'Skip this story' : 'Include this story'}
        </button>
      </div>
    </div>
  );
}
```

### 5.4 DateOrAgeSelector Component

```tsx
interface DateOrAgeSelectorProps {
  year?: number;
  age?: number;
  lifePhase?: string;
  userBirthYear: number;
  onChange: (values: { storyYear?: number; storyAge?: number; lifePhase?: string }) => void;
}

function DateOrAgeSelector({ year, age, lifePhase, userBirthYear, onChange }: DateOrAgeSelectorProps) {
  const [mode, setMode] = useState<'year' | 'age' | 'unknown'>(
    year ? 'year' : age ? 'age' : 'unknown'
  );

  const calculateYear = (inputAge: number) => userBirthYear + inputAge;
  const calculateAge = (inputYear: number) => inputYear - userBirthYear;

  return (
    <div className="space-y-3">
      <label className="text-base font-medium text-[var(--hw-text-primary)]">
        When did this happen?
      </label>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('year')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition
            ${mode === 'year'
              ? 'bg-[var(--hw-primary)] text-white'
              : 'bg-[var(--hw-surface)] text-[var(--hw-text-secondary)]'}`}
        >
          I know the year
        </button>
        <button
          onClick={() => setMode('age')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition
            ${mode === 'age'
              ? 'bg-[var(--hw-primary)] text-white'
              : 'bg-[var(--hw-surface)] text-[var(--hw-text-secondary)]'}`}
        >
          I know my age
        </button>
        <button
          onClick={() => {
            setMode('unknown');
            onChange({ storyYear: undefined, storyAge: undefined });
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition
            ${mode === 'unknown'
              ? 'bg-[var(--hw-primary)] text-white'
              : 'bg-[var(--hw-surface)] text-[var(--hw-text-secondary)]'}`}
        >
          I don't remember
        </button>
      </div>

      {/* Year input */}
      {mode === 'year' && (
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1900}
            max={new Date().getFullYear()}
            value={year || ''}
            onChange={(e) => {
              const y = parseInt(e.target.value);
              onChange({
                storyYear: y,
                storyAge: calculateAge(y),
                lifePhase: getLifePhase(calculateAge(y))
              });
            }}
            className="w-24 px-3 py-2 border rounded-lg text-lg"
            placeholder="1965"
          />
          {year && (
            <span className="text-sm text-[var(--hw-text-muted)]">
              (You were about {calculateAge(year)} years old)
            </span>
          )}
        </div>
      )}

      {/* Age input */}
      {mode === 'age' && (
        <div className="flex items-center gap-3">
          <span className="text-base">I was about</span>
          <input
            type="number"
            min={0}
            max={120}
            value={age || ''}
            onChange={(e) => {
              const a = parseInt(e.target.value);
              onChange({
                storyAge: a,
                storyYear: calculateYear(a),
                lifePhase: getLifePhase(a)
              });
            }}
            className="w-20 px-3 py-2 border rounded-lg text-lg text-center"
            placeholder="10"
          />
          <span className="text-base">years old</span>
          {age && (
            <span className="text-sm text-[var(--hw-text-muted)]">
              (Around {calculateYear(age)})
            </span>
          )}
        </div>
      )}

      {/* Unknown - show life phase selector */}
      {mode === 'unknown' && (
        <div className="space-y-2">
          <p className="text-sm text-[var(--hw-text-muted)]">
            That's okay! What period of your life was this?
          </p>
          <div className="flex flex-wrap gap-2">
            {['childhood', 'teen', 'early_adult', 'mid_adult', 'late_adult', 'senior'].map((phase) => (
              <button
                key={phase}
                onClick={() => onChange({ lifePhase: phase })}
                className={`px-4 py-2 rounded-full text-sm transition
                  ${lifePhase === phase
                    ? 'bg-[var(--hw-accent-gold)] text-white'
                    : 'bg-[var(--hw-surface)] text-[var(--hw-text-secondary)]'}`}
              >
                {formatLifePhase(phase)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getLifePhase(age: number): string {
  if (age < 13) return 'childhood';
  if (age < 20) return 'teen';
  if (age < 35) return 'early_adult';
  if (age < 55) return 'mid_adult';
  if (age < 70) return 'late_adult';
  return 'senior';
}

function formatLifePhase(phase: string): string {
  const labels: Record<string, string> = {
    childhood: 'Childhood (0-12)',
    teen: 'Teenage Years (13-19)',
    early_adult: 'Young Adult (20-34)',
    mid_adult: 'Middle Years (35-54)',
    late_adult: 'Later Adult (55-69)',
    senior: 'Senior Years (70+)',
  };
  return labels[phase] || phase;
}
```

### 5.5 Mobile Layout (375px)

```
┌─────────────────────────────────┐
│  ← Back                         │
│                                 │
│  We found 3 stories             │
│  in your interview              │
│                                 │
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │ 1 │ 2:45                 │   │
│  ├─────────────────────────┤   │
│  │ Summer at Grandma's     │   │  ← Editable
│  │ Farm                    │   │
│  ├─────────────────────────┤   │
│  │ ▶ ━━━━━━━━━━━━━ 2:45   │   │  ← Audio player
│  ├─────────────────────────┤   │
│  │ ┌─────┐ + Add photo     │   │  ← Photo upload
│  │ │     │                 │   │
│  │ └─────┘                 │   │
│  ├─────────────────────────┤   │
│  │ When did this happen?   │   │
│  │ [Year] [Age] [Unknown]  │   │
│  │ ┌─────────────────────┐ │   │
│  │ │ I was about [10]    │ │   │
│  │ │ years old           │ │   │
│  │ └─────────────────────┘ │   │
│  ├─────────────────────────┤   │
│  │ ▼ Show transcript       │   │
│  │                         │   │
│  │      [Skip this story]  │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Story 2...              │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Story 3...              │   │
│  └─────────────────────────┘   │
│                                 │
│  ▼ Listen to full interview    │
│                                 │
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │    Save 3 Stories       │   │  ← 60px primary
│  └─────────────────────────┘   │
│                                 │
│  Save as single story instead  │  ← Text link fallback
│                                 │
└─────────────────────────────────┘
```

---

## Part 6: Timestamp Capture Implementation

### 6.1 Current Gap

The Realtime API provides transcription events:
- `conversation.item.input_audio_transcription.completed` - Final user transcript

But we're not capturing:
1. When each message started (relative to session start)
2. Duration of each utterance
3. Pearl's response timestamps

### 6.2 Implementation in `use-realtime-interview.tsx`

```typescript
// Add to hook state
const sessionStartTimeRef = useRef<number | null>(null);
const messagesWithTimestampsRef = useRef<MessageWithTimestamp[]>([]);

interface MessageWithTimestamp {
  id: string;
  sender: 'user' | 'pearl';
  content: string;
  startMs: number;    // Relative to session start
  endMs: number;      // Relative to session start
}

// In onConnected callback
onConnected: () => {
  sessionStartTimeRef.current = Date.now();
  // ... existing code
}

// In transcript completed handler
if (msg.type === 'conversation.item.input_audio_transcription.completed') {
  const now = Date.now();
  const sessionStart = sessionStartTimeRef.current || now;

  // Calculate timing
  const endMs = now - sessionStart;
  // Estimate start based on transcript length (rough: ~150 words/minute)
  const wordCount = (msg.transcript || '').split(/\s+/).length;
  const estimatedDurationMs = (wordCount / 150) * 60 * 1000;
  const startMs = Math.max(0, endMs - estimatedDurationMs);

  messagesWithTimestampsRef.current.push({
    id: `user-${now}`,
    sender: 'user',
    content: msg.transcript || '',
    startMs,
    endMs,
  });

  callbacks.onTranscriptFinal(msg.transcript || '');
}

// In assistant response handler
onAssistantTextDone: () => {
  const now = Date.now();
  const sessionStart = sessionStartTimeRef.current || now;

  // Pearl just finished speaking
  const content = assistantResponseRef.current;
  const wordCount = content.split(/\s+/).length;
  const estimatedDurationMs = (wordCount / 150) * 60 * 1000;
  const endMs = now - sessionStart;
  const startMs = Math.max(0, endMs - estimatedDurationMs);

  messagesWithTimestampsRef.current.push({
    id: `pearl-${now}`,
    sender: 'pearl',
    content,
    startMs,
    endMs,
  });

  // ... existing response handling
}

// Export getter for timestamps
const getMessagesWithTimestamps = useCallback(() => {
  return messagesWithTimestampsRef.current;
}, []);

// Return from hook
return {
  // ... existing returns
  getMessagesWithTimestamps,
};
```

### 6.3 More Accurate Timing (Future Enhancement)

For more accurate timestamps, we could:

1. **Use `response.audio_transcript.delta` timing** - OpenAI may provide word-level timestamps in the future
2. **Client-side audio analysis** - Detect speech boundaries in the recorded audio
3. **Whisper with timestamps** - Re-process audio through Whisper API with `timestamp_granularities`

For MVP, estimated timing based on word count is acceptable.

---

## Part 7: Implementation Phases

### Phase 1: Foundation (Critical - Week 1)

| Task | Priority | Effort |
|------|----------|--------|
| Create `interviews` table migration | Critical | 1 hour |
| Add `source_interview_id`, `story_age` to stories | Critical | 30 min |
| Implement timestamp capture in hook | Critical | 2 hours |
| Create `/api/interviews` POST endpoint | Critical | 1 hour |
| Create `/api/upload/interview-audio` endpoint | Critical | 1 hour |
| Update `/api/analyze-stories` for timestamps | High | 2 hours |

**Deliverable:** Interview data properly captured and stored

### Phase 2: Audio Slicing (Critical - Week 1-2)

| Task | Priority | Effort |
|------|----------|--------|
| Create Supabase Edge Function for FFmpeg | Critical | 4 hours |
| Create `/api/slice-audio` endpoint | Critical | 2 hours |
| Test slicing accuracy | Critical | 2 hours |
| Fallback for single-story mode | High | 1 hour |

**Deliverable:** Audio segments created for each detected story

### Phase 3: Review Screen (Critical - Week 2)

| Task | Priority | Effort |
|------|----------|--------|
| Create `/app/review/interview/page.tsx` | Critical | 4 hours |
| Build `StoryReviewCard` component | Critical | 4 hours |
| Build `DateOrAgeSelector` component | Critical | 2 hours |
| Build `AudioSegmentPlayer` component | High | 2 hours |
| Photo upload integration | High | 2 hours |
| Mobile responsive testing | Critical | 2 hours |

**Deliverable:** Fully functional review screen

### Phase 4: Save Flow (Critical - Week 2-3)

| Task | Priority | Effort |
|------|----------|--------|
| Create `/api/interviews/[id]/stories` batch endpoint | Critical | 2 hours |
| Connect review screen to save endpoint | Critical | 2 hours |
| Success screen with summary | High | 1 hour |
| Redirect to Timeline | High | 30 min |
| Delete draft after success | Medium | 30 min |

**Deliverable:** Complete end-to-end flow

### Phase 5: Polish (Post-Launch)

| Task | Priority | Effort |
|------|----------|--------|
| Interview history view | Medium | 4 hours |
| Re-process old interviews | Low | 2 hours |
| Story merging (if AI splits wrong) | Low | 8 hours |
| Enhanced timestamp accuracy | Low | 4 hours |

---

## Part 8: Risk Assessment

### High Risk

| Risk | Mitigation |
|------|------------|
| **FFmpeg in Edge Function fails** | Fallback: Return full audio as single story, let user manually note timestamps |
| **AI story detection poor quality** | Fallback: "Save as Single Story" always available |
| **Long interviews timeout** | Process in chunks; max interview length of 45 min |

### Medium Risk

| Risk | Mitigation |
|------|------------|
| **Timestamp estimation inaccurate** | Word-count estimation is 80% accurate; good enough for segment boundaries |
| **Large audio files slow to upload** | Show progress; chunk upload if needed |
| **Users confused by multi-story review** | Clear UX with numbered cards; "Save as single story" escape hatch |

### Low Risk

| Risk | Mitigation |
|------|------------|
| **Storage costs increase** | WebM Opus is efficient (~500KB/min); monitor usage |
| **Users want to re-split stories later** | Store original interview; future feature |

---

## Part 9: Success Metrics

### Launch Criteria

- [ ] 95% of interviews successfully save at least 1 story
- [ ] Audio segment playback works on iOS Safari, Chrome, Firefox
- [ ] Review screen loads in <3 seconds
- [ ] Full flow works on 375px mobile viewport
- [ ] No data loss if browser crashes mid-review (auto-save)

### Post-Launch Metrics

| Metric | Target |
|--------|--------|
| Interviews → Stories conversion | >80% of users complete review |
| Average stories per interview | 2-4 |
| Time on review screen | <5 minutes |
| "Save as single story" fallback usage | <20% |

---

## Appendix A: File Locations Reference

| File | Purpose |
|------|---------|
| `/shared/schema.ts` | Database types - add interview types here |
| `/app/api/stories/route.ts` | Story creation endpoint |
| `/app/api/analyze-stories/route.ts` | Story detection - update for timestamps |
| `/hooks/use-realtime-interview.tsx` | Main hook - add timestamp capture |
| `/lib/realtimeClient.ts` | WebRTC client - no changes needed |
| `/app/interview-chat-v2/page.tsx` | Interview page - update completion flow |
| `/components/BookStyleReview.tsx` | Reference for review patterns |
| `/components/post-recording/` | Reference for wizard patterns |
| `DESIGN_GUIDELINES.md` | Design tokens and patterns |

---

## Appendix B: Database Migration

```sql
-- Migration: 20251212000000_create_interviews_table.sql

-- Create interviews table for master interview archives
CREATE TABLE interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Audio artifacts
  full_audio_url TEXT NOT NULL,
  mixed_audio_url TEXT,
  duration_seconds INTEGER NOT NULL,

  -- Transcript with timestamps
  transcript_json JSONB NOT NULL DEFAULT '[]',

  -- Metadata
  theme TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'processing', 'archived')),

  -- AI analysis results
  detected_stories JSONB,
  stories_parsed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_interviews_user_id ON interviews(user_id);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_created_at ON interviews(created_at DESC);

-- RLS
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interviews"
  ON interviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interviews"
  ON interviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interviews"
  ON interviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interviews"
  ON interviews FOR DELETE
  USING (auth.uid() = user_id);

-- Extend stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS source_interview_id UUID
  REFERENCES interviews(id) ON DELETE SET NULL;

ALTER TABLE stories ADD COLUMN IF NOT EXISTS interview_start_ms INTEGER;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS interview_end_ms INTEGER;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS story_age INTEGER;

CREATE INDEX IF NOT EXISTS idx_stories_source_interview ON stories(source_interview_id);

-- Add comment for documentation
COMMENT ON TABLE interviews IS 'Master archive of Pearl AI interviews with full audio and timestamped transcripts';
COMMENT ON COLUMN stories.source_interview_id IS 'Link to source interview if story was parsed from an interview';
COMMENT ON COLUMN stories.story_age IS 'Age of storyteller at time of story (alternative to year)';
```

---

*Document created: December 11, 2025*
*Last updated: December 11, 2025*
