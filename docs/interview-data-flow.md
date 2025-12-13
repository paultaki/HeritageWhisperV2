# Interview Data Flow & Storage

## Overview
This document explains how interview data is captured, stored, and passed to the post-processing/review screen.

## Data Capture During Interview

### Audio Recording (Realtime API Mode)
The `useRealtimeInterview` hook manages TWO separate audio recordings:

1. **Mixed Audio** (`getMixedAudioBlob()`):
   - Contains: User voice + Pearl voice
   - Format: WebM (Opus codec)
   - Purpose: Full conversation recording for debugging/archive
   - Stored in: `mixedAudioBlobRef.current`

2. **User-Only Audio** (`getUserAudioBlob()`):
   - Contains: ONLY user voice (Pearl filtered out)
   - Format: WebM (Opus codec)
   - Purpose: Final story audio (no AI interviewer)
   - Stored in: `userOnlyAudioBlobRef.current`
   - **This is what gets saved to the final story**

### Transcript Recording
Stored in the `messages` array in `/app/interview-chat-v3/page.tsx`:

```typescript
Message {
  id: string;
  type: 'question' | 'audio-response' | 'text-response';
  content: string;  // The actual text
  sender: 'hw' | 'user';  // 'hw' = Pearl, 'user' = John
  timestamp: Date;
  audioBlob?: Blob;  // Per-message audio (if needed)
  audioDuration?: number;
}
```

**Two transcript formats are generated:**

1. **Q&A Pairs** (structured):
```typescript
{
  question: "What's your earliest memory?",
  answer: "I remember my grandmother's kitchen...",
  timestamp: "2025-12-12T10:30:00Z"
}
```

2. **Full Transcript** (conversational):
```
Pearl: What's your earliest memory?
User: I remember my grandmother's kitchen...
Pearl: Can you tell me more about that?
User: It was a small kitchen with...
```

## Data Flow on "Finish & Review Story"

```
User clicks "Done" → "Finish & Review Story"
           ↓
handleConfirmedComplete() runs
           ↓
┌──────────────────────────────────────┐
│ 1. Stop Recording                   │
│    - stopSession() (Realtime API)   │
│    - Get audio blobs from memory    │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ 2. Extract Data                      │
│    - mixedBlob = getMixedAudioBlob() │
│    - userBlob = getUserAudioBlob()   │
│    - qaPairs = extractQAPairs(msgs)  │
│    - fullTranscript = format(msgs)   │
│    - duration = recordingDuration    │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ 3. Analyze for Multiple Stories     │
│    POST /api/analyze-stories         │
│    {                                 │
│      transcript: fullTranscript,     │
│      userName: "John"                │
│    }                                 │
│    ↓                                 │
│    Returns:                          │
│    {                                 │
│      stories: [                      │
│        {                             │
│          title: "Grandmother's...",  │
│          bridged_text: "...",        │
│          start_time: 0,              │
│          end_time: 120               │
│        }                             │
│      ]                               │
│    }                                 │
└──────────────────────────────────────┘
           ↓
      ┌────┴────┐
      │         │
   1 story   Multiple stories
      │         │
      ↓         ↓
  Single    Split Modal
   Flow     (user chooses)
      │         │
      └────┬────┘
           ↓
┌──────────────────────────────────────┐
│ 4. Save to NavCache                  │
│    (In-memory + localStorage)        │
│                                      │
│    NavPayload {                      │
│      mode: 'conversation',           │
│      audioBlob: userOnlyBlob,  ← IMPORTANT│
│      duration: 180,                  │
│      rawTranscript: "Pearl: ...",    │
│      qaPairs: [{...}],               │
│      lessonLearned: "...",           │
│      nextNavId?: "nav-id-2"  ← If multiple stories│
│    }                                 │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ 5. Redirect to Review Page           │
│    /review/book-style?nav=<id>&mode=wizard│
└──────────────────────────────────────┘
```

## Storage Locations

### 1. During Interview (Temporary - Browser Memory)
- **Audio blobs**: `useRealtimeInterview` hook refs
  - `mixedAudioBlobRef.current` (user + Pearl)
  - `userOnlyAudioBlobRef.current` (user only) ← **This is what you want**
- **Messages**: `messages` state array in page.tsx
- **Session timer**: `sessionDuration` state

### 2. After "Finish" (Temporary - NavCache)
- **Location**: `/lib/navCache.ts`
- **Storage**:
  - Primary: In-memory JavaScript Map (fast)
  - Backup: localStorage (survives page refresh)
- **Data structure**:
```typescript
navCache.set("nav-abc123", {
  mode: 'conversation',
  audioBlob: Blob,  // User-only audio
  duration: 180,
  rawTranscript: "Pearl: ...\nUser: ...",
  qaPairs: [
    { question: "...", answer: "..." }
  ],
  lessonLearned: "...",
  nextNavId: "nav-def456"  // If part of a chain
})
```

### 3. Final Save (Permanent - Supabase Database)
- Happens in `/review/book-style` wizard flow
- Saves to `stories` table (see DATA_MODEL.md)

## What You Need for Post-Processing Screen

When user clicks "Finish & Review Story", you have access to:

### Available Data
```typescript
{
  // AUDIO
  mixedAudioBlob: Blob,      // User + Pearl (debugging/archive)
  userOnlyAudioBlob: Blob,   // User only (final story) ← USE THIS

  // TRANSCRIPTS
  fullTranscript: string,    // "Pearl: ...\nUser: ..."
  qaPairs: [
    {
      question: "What's your earliest memory?",
      answer: "I remember my grandmother's kitchen..."
    }
  ],

  // METADATA
  totalDuration: number,     // seconds
  sessionStartTime: Date,
  selectedTheme: InterviewTheme,

  // OPTIONAL (if analyzed)
  analyzedStories: [
    {
      title: "Grandmother's Kitchen",
      bridged_text: "Reorganized narrative...",
      start_time: 0,
      end_time: 120
    }
  ]
}
```

## Your Post-Processing Screen Requirements

Based on your description, you want TWO modes:

### Mode 1: "Original" (Unmodified Interview)
```
┌─────────────────────────────────────┐
│ Original Interview Recording        │
├─────────────────────────────────────┤
│ Audio: mixedAudioBlob               │
│ (Full conversation with Pearl)      │
│                                     │
│ Transcript:                         │
│ Pearl: What's your earliest memory? │
│ John: I remember...                 │
│ Pearl: Can you tell me more?        │
│ John: It was a small kitchen...     │
└─────────────────────────────────────┘
```

**Data sources:**
- Audio: `getMixedAudioBlob()` from hook
- Transcript: `fullTranscript` (formatted messages)

### Mode 2: "Reorganized Stories" (AI-Processed)
```
┌─────────────────────────────────────┐
│ Story 1: Grandmother's Kitchen      │
├─────────────────────────────────────┤
│ Audio: splitAudioBlob[0]            │
│ (Just user, segments 0-120s)        │
│                                     │
│ Transcript: bridged_text            │
│ "My earliest memory is of my        │
│ grandmother's kitchen. It was       │
│ small but always smelled like..."   │
│ (Reorganized, Pearl removed)        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Story 2: First Day of School        │
├─────────────────────────────────────┤
│ Audio: splitAudioBlob[1]            │
│ Transcript: bridged_text            │
│ ...                                 │
└─────────────────────────────────────┘
```

**Data sources:**
- Audio: Split user-only audio (via `/api/process-audio/split`)
- Transcript: `analyzedStories[i].bridged_text`

## Implementation Plan for Post-Processing Screen

### Step 1: Create New Route
```
/app/interview-review/page.tsx
```

### Step 2: Receive Data via NavCache
```typescript
const searchParams = useSearchParams();
const navId = searchParams.get('nav');
const data = navCache.get(navId);

// You now have:
// - data.audioBlob (user-only audio)
// - data.rawTranscript (full Pearl + User)
// - data.qaPairs (structured Q&A)
// - data.duration
```

### Step 3: Two Tabs/Modes

**Tab 1: "Original Recording"**
- Play `mixedAudioBlob` (you'll need to pass this separately or fetch it)
- Display `rawTranscript` in a simple list format

**Tab 2: "Story Mode" (Reorganized)**
- Call `/api/analyze-stories` with `rawTranscript`
- Get back multiple story objects
- For each story:
  - Split audio using `/api/process-audio/split`
  - Display `bridged_text`
  - Allow reordering, editing

### Step 4: Save Final Version
After user reviews/edits:
- Save to Supabase `stories` table
- Upload audio to storage
- Mark interview as complete

## Key Files to Reference

1. **Current interview flow**:
   - `/app/interview-chat-v3/page.tsx` (lines 497-544)
   - `/hooks/use-realtime-interview.tsx`

2. **Data handling**:
   - `/lib/conversationModeIntegration.ts` (completeConversationAndRedirect)
   - `/lib/navCache.ts` (temporary storage)

3. **Story analysis**:
   - `/app/api/analyze-stories/route.ts` (splits into multiple stories)

4. **Current review flow** (you'll replace/extend this):
   - `/app/review/book-style/page.tsx` (wizard mode)

## Next Steps

1. **Create the post-processing route**: `/app/interview-review/page.tsx`
2. **Decide data flow**:
   - Option A: Intercept before `completeConversationAndRedirect`
   - Option B: Add to NavCache, pull from review screen
3. **Design the UI**: Two-tab layout (Original vs Stories)
4. **Implement audio splitting**: Use existing `/api/process-audio/split`
5. **Save finalized version**: To Supabase stories table
