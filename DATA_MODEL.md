# HeritageWhisperV2 - Data Model & Entity-Relationship Diagrams

> **Last Updated:** January 25, 2025
> **Purpose:** Comprehensive documentation of database schemas, service models, and UI data structures

## Table of Contents
1. [Overview](#overview)
2. [Database Schema Layer](#database-schema-layer)
3. [Service Layer Models](#service-layer-models)
4. [UI Data Models](#ui-data-models)
5. [Key Relationships](#key-relationships)
6. [Data Flow Patterns](#data-flow-patterns)

---

## Overview

HeritageWhisperV2 uses a **three-layer data architecture**:

- **Database Layer (PostgreSQL):** Managed via Supabase with Drizzle ORM
- **Service Layer (Next.js API Routes):** REST API with JWT authentication
- **UI Layer (React/TypeScript):** TanStack Query for state management

**Key Technologies:**
- Database: PostgreSQL 15+ via Supabase
- ORM: Drizzle ORM with type-safe schemas
- API: Next.js 15 App Router API routes
- State: TanStack Query v5 + React Context
- Auth: Supabase Auth with JWT tokens + WebAuthn passkeys

---

## Database Schema Layer

### Core Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o{ stories : "creates"
    users ||--o{ passkeys : "has"
    users ||--o{ activePrompts : "receives"
    users ||--o{ promptHistory : "archives"
    users ||--o{ familyMembers : "invites (as storyteller)"
    users ||--o{ sharedAccess : "shares timeline (as owner)"
    users ||--o| profiles : "has personalization"
    users ||--o{ userAgreements : "accepts"
    users ||--o{ historicalContext : "caches"

    stories ||--o{ followUps : "generates"
    stories ||--o| activePrompts : "sources from (optional)"

    familyMembers ||--o{ familyActivity : "tracks"

    sharedAccess }o--|| users : "grants access to (when registered)"

    users {
        uuid id PK
        text email UK
        text password "nullable for OAuth"
        text name
        int birthYear
        text bio
        text profilePhotoUrl
        int storyCount
        bool isPaid
        bool emailNotifications
        bool weeklyDigest
        bool familyComments
        bool printedBooksNotify
        bool defaultStoryVisibility
        int pdfExportsCount
        timestamp lastPdfExportAt
        int dataExportsCount
        timestamp lastDataExportAt
        text latestTermsVersion
        text latestPrivacyVersion
        int freeStoriesUsed
        text subscriptionStatus
        timestamp lastTier2Attempt
        jsonb doNotAsk "array of prompt IDs"
        timestamp onboardingT3RanAt
        jsonb profileInterests "general, people, places"
        timestamp createdAt
        timestamp updatedAt
    }

    passkeys {
        uuid id PK
        uuid userId FK
        text credentialId UK
        text publicKey
        bigint signCount
        bool credentialBackedUp
        text credentialDeviceType "singleDevice | multiDevice"
        jsonb transports "array of transport types"
        text friendlyName "e.g. iPhone 14"
        timestamp createdAt
        timestamp lastUsedAt
    }

    stories {
        uuid id PK
        uuid userId FK
        text title
        text audioUrl
        text transcription
        int durationSeconds
        text wisdomClipUrl
        text wisdomClipText
        int wisdomClipDuration
        int storyYear "nullable"
        timestamp storyDate
        int lifeAge
        text lessonLearned
        jsonb lessonAlternatives "array of strings"
        jsonb entitiesExtracted "people, places, objects, emotions"
        uuid sourcePromptId FK "nullable"
        text lifePhase "childhood | teen | early_adult | etc"
        text photoUrl
        jsonb photoTransform "zoom, position"
        jsonb photos "array with id, url, transform, caption, isHero"
        jsonb emotions "array of strings"
        text pivotalCategory
        bool includeInBook
        bool includeInTimeline
        bool isFavorite
        jsonb formattedContent "fullText, paragraphs, pages, questions"
        jsonb extractedFacts "people, places, events, possessions"
        timestamp createdAt
    }

    activePrompts {
        uuid id PK
        uuid userId FK
        text promptText
        text contextNote
        text anchorEntity "dedup key component"
        int anchorYear "nullable"
        text anchorHash UK "sha1 hash for dedup"
        int tier "0-3: fallback, template, on-demand, milestone"
        text memoryType "person_expansion, object_origin, etc"
        int promptScore "0-100 recording likelihood"
        text scoreReason
        text modelVersion
        timestamp createdAt
        timestamp expiresAt
        bool isLocked "paywall flag"
        int shownCount
        timestamp lastShownAt
    }

    promptHistory {
        uuid id PK
        uuid userId FK
        text promptText
        text anchorHash
        text anchorEntity
        int anchorYear
        int tier
        text memoryType
        int promptScore
        int shownCount
        text outcome "used | skipped | expired"
        uuid storyId FK "nullable"
        timestamp createdAt
        timestamp resolvedAt
    }

    familyMembers {
        uuid id PK
        uuid userId FK "storyteller"
        text email
        text name
        text relationship "Son, Daughter, etc"
        text status "pending | active | declined"
        timestamp invitedAt
        timestamp acceptedAt
        timestamp lastViewedAt
        text customMessage
        jsonb permissions "canView, canComment, canDownload"
    }

    familyActivity {
        uuid id PK
        uuid userId FK "storyteller"
        uuid familyMemberId FK
        uuid storyId FK "nullable"
        text activityType "viewed | commented | favorited | shared"
        text details
        timestamp createdAt
    }

    sharedAccess {
        uuid id PK
        uuid ownerUserId FK
        text sharedWithEmail
        uuid sharedWithUserId FK "nullable until signup"
        text permissionLevel "view | edit"
        text shareToken UK
        timestamp createdAt
        timestamp expiresAt "nullable"
        bool isActive
        timestamp lastAccessedAt
    }

    profiles {
        uuid id PK
        uuid userId FK UK
        int birthYear
        jsonb majorLifePhases "childhood, youngAdult, midLife, senior"
        int workEthic "1-10"
        int riskTolerance "1-10"
        int familyOrientation "1-10"
        int spirituality "1-10"
        text preferredStyle "direct | gentle | curious | reflective"
        int emotionalComfort "1-10"
        text detailLevel "brief | moderate | detailed"
        text followUpFrequency "minimal | occasional | frequent"
        int completionPercentage
        timestamp createdAt
        timestamp updatedAt
    }

    followUps {
        uuid id PK
        uuid storyId FK
        text questionText
        text questionType
        bool wasAnswered
    }

    historicalContext {
        uuid id PK
        uuid userId FK
        text decade "e.g. 1950s"
        text ageRange "e.g. Age 5-15"
        jsonb facts "array of strings"
        timestamp generatedAt
        timestamp updatedAt
    }

    userAgreements {
        uuid id PK
        uuid userId FK
        text agreementType "terms | privacy"
        text version "e.g. 1.0, 1.1"
        timestamp acceptedAt
        text ipAddress "nullable"
        text userAgent "nullable"
        text method "signup | reacceptance | oauth"
    }

    demoStories {
        uuid id PK
        uuid userId "fixed demo user ID"
        text title
        text audioUrl
        text transcription
        int durationSeconds
        text wisdomClipUrl
        text wisdomClipText
        int wisdomClipDuration
        int storyYear
        timestamp storyDate
        int lifeAge
        text photoUrl
        jsonb photoTransform
        jsonb photos
        jsonb emotions
        text pivotalCategory
        bool includeInBook
        bool includeInTimeline
        bool isFavorite
        jsonb formattedContent
        timestamp createdAt
        bool isOriginal
        text publicAudioUrl
        text publicPhotoUrl
    }
```

### Database Constraints

**Primary Keys:** All tables use UUID primary keys (gen_random_uuid())

**Unique Constraints:**
- `users.email` - One account per email
- `passkeys.credential_id` - Globally unique WebAuthn credentials
- `passkeys(user_id, credential_id)` - Composite unique (prevent cross-tenant clashes)
- `activePrompts.anchor_hash` - Deduplication across prompt generations
- `sharedAccess.share_token` - Unique share URLs
- `profiles.user_id` - One profile per user

**Foreign Key Cascades:**
- `passkeys.user_id` → ON DELETE CASCADE (delete passkeys when user deleted)
- `activePrompts.user_id` → ON DELETE CASCADE
- `promptHistory.user_id` → ON DELETE CASCADE

**Check Constraints:**
- `stories.duration_seconds` - Between 1 and 120 (database-level clamp)
- `activePrompts.tier` - Integer 0-3
- `activePrompts.prompt_score` - Integer 0-100

---

## Service Layer Models

### API Architecture Patterns

**Authentication Flow:**
```
Client → JWT Token → API Route → Supabase Auth Verify → Database Query → Response
```

**Multi-Tenant Access Pattern:**
```typescript
// All story-related endpoints support storyteller_id parameter
GET /api/stories?storyteller_id=<uuid>

// Access verification via RPC
has_collaboration_access(p_user_id, p_storyteller_id) → boolean
```

### Key Service Models

#### 1. **Story Creation Flow**

```typescript
POST /api/stories
{
  title: string
  transcription: string
  audioUrl?: string
  year?: number
  storyYear?: number
  lifeAge?: number
  durationSeconds: number (1-600, clamped to 120 for DB)
  photos?: Array<{
    id: string
    url: string
    transform?: { zoom: number, position: {x, y} }
    caption?: string
    isHero?: boolean
  }>
  photoUrl?: string
  photoTransform?: { zoom: number, position: {x, y} }
  emotions?: string[]
  lessonLearned?: string
  wisdomClipText?: string
  wisdomClipUrl?: string
  pivotalCategory?: string
  includeInBook?: boolean
  includeInTimeline?: boolean
  isFavorite?: boolean
  sourcePromptId?: uuid
}

// Triggers:
1. Validate with Zod schema (CreateStorySchema)
2. Save story to database
3. Mark source prompt as "used" if applicable
4. Check AI consent (skip if disabled)
5. Generate Tier 1 prompts (relationship-first templates)
6. Generate Echo prompt (immediate follow-up)
7. Check for milestone (trigger Tier 3 if applicable)
8. Return transformed story
```

#### 2. **Prompt System Flow**

```typescript
// Active Prompts (shown to user)
GET /api/prompts/active?storyteller_id=<uuid>
→ Returns unlocked, non-expired, non-queued prompts

// Prompt Lifecycle
1. Generation: Created via Tier 1/3 after story save
2. Presentation: Shown in prompts library
3. Selection: User queues or dismisses
4. Usage: User records story with sourcePromptId
5. Archival: Moved to prompt_history with outcome

// Deduplication via anchor_hash
sha1(`${tier}|${entity}|${year || 'NA'}`)
```

#### 3. **Family Sharing System**

```typescript
// Available Storytellers
GET /api/accounts/available
→ [
  {
    storytellerId: uuid
    storytellerName: string
    permissionLevel: 'viewer' | 'contributor'
    relationship: string | null
    lastViewedAt: timestamp | null
  }
]

// Multi-tenant data access (camelCase → snake_case mapping)
Frontend (camelCase):
{
  storytellerId, storytellerName, permissionLevel
}

Database (snake_case):
{
  user_id, name, permission_level
}

API Layer: Auto-transforms between conventions
```

#### 4. **Transcription Pipeline**

```typescript
// Primary: AssemblyAI (batch mode)
POST /api/transcribe-assemblyai
{
  audioUrl: string
  language?: string
}
→ {
  transcription: string
  durationSeconds: number
  lessonOptions?: string[] (3 AI-generated alternatives)
}

// Fallback: OpenAI Whisper
POST /api/transcribe
// Real-time: OpenAI Realtime API (Pearl interviewer)
POST /api/realtime-session
```

#### 5. **PDF Export Pipeline**

```typescript
// 2-up format (home printing)
POST /api/export/2up
→ PDFShift cloud service generates 11"x8.5" landscape

// Trim format (POD)
POST /api/export/trim
→ PDFShift cloud service generates 5.5"x8.5" portrait

// Rate limiting: 10 exports per hour per user
```

### Service Layer Data Transformations

**Database → API Response Mapping:**

```typescript
// Database columns (snake_case)
{
  user_id: uuid
  created_at: timestamp
  photo_url: string
  wisdom_text: string
}

// API Response (camelCase)
{
  userId: uuid
  createdAt: timestamp
  photoUrl: string
  wisdomTranscription: string
}
```

**Photo URL Signing:**
```typescript
// Storage path → Signed URL (7-day expiry)
"photo/abc123.jpg" → "https://...supabase.co/...?token=..."
```

---

## UI Data Models

### React Context Providers

#### 1. **AccountContext** (`useAccountContext`)

```typescript
interface AccountContext {
  storytellerId: string        // Current viewed account
  storytellerName: string      // Display name
  type: 'own' | 'viewing'      // Own stories vs family member
  permissionLevel: 'viewer' | 'contributor' | 'owner'
  relationship: string | null  // e.g. "Daughter", "Son"
}

interface AvailableStoryteller {
  storytellerId: string
  storytellerName: string
  permissionLevel: 'viewer' | 'contributor'
  relationship: string | null
  lastViewedAt: string | null
}

// Methods
switchToStoryteller(id: string)  // Switch context + invalidate queries
resetToOwnAccount()               // Return to own stories
refreshStorytellers()             // Re-fetch available accounts
```

**Storage:** localStorage key: `hw_active_storyteller_context`

**Query Invalidation:**
```typescript
// When switching accounts, invalidate:
queryClient.invalidateQueries({ queryKey: ['stories'] })
queryClient.invalidateQueries({ queryKey: ['/api/stories'] })
```

#### 2. **AuthContext** (`useAuth`)

```typescript
interface User {
  id: uuid
  email: string
  name: string
  birthYear: number
  bio?: string
  profilePhotoUrl?: string
  emailNotifications: boolean
  weeklyDigest: boolean
  familyComments: boolean
  printedBooksNotify: boolean
}

// Methods
login(email, password)
logout()
register(email, password, name, birthYear)
```

#### 3. **Recording Wizard** (`useRecordingWizard`)

```typescript
interface RecordingState {
  step: 1 | 2 | 3 | 4 | 5  // Countdown → Recording → Processing → Review → Save
  audioBlob?: Blob
  audioUrl?: string
  transcription?: string
  durationSeconds?: number
  lessonOptions?: string[]
  selectedLesson?: string
  title?: string
  year?: number
  age?: number
  photos?: Array<{
    id: string
    file: File
    preview: string
    url?: string  // After upload
    transform?: { zoom: number, position: {x, y} }
    caption?: string
    isHero?: boolean
  }>
  sourcePromptId?: uuid
}

// Flow
Step 1: 3-2-1 countdown
Step 2: Recording (5 min max) + VAD detection
Step 3: Transcription (AssemblyAI batch)
Step 4: Lesson selection (3 AI options + custom)
Step 5: Photo upload, title, year, save
```

#### 4. **Pearl Realtime Interview** (`useRealtimeInterview`)

```typescript
interface RealtimeConversation {
  isConnected: boolean
  isRecording: boolean
  conversationItems: Array<{
    id: string
    role: 'user' | 'assistant'
    type: 'message' | 'function_call'
    content: string
    timestamp: number
  }>
  elapsedTime: number  // seconds
  userAudioBlob?: Blob  // User-only recording (excludes Pearl's voice)
  mixedAudioBlob?: Blob // User + Pearl (for debugging)
}

// Config
Model: gpt-4o-realtime-preview-2024-12-17
Token Limit: 1200 tokens (~15-18 sentences)
VAD Threshold: 0.7 (less sensitive)
Barge-in Delay: 400ms
Session Timeout: 30 minutes
```

### UI Component Data Patterns

#### 1. **Timeline View**

```typescript
// Data Structure
interface TimelineDecade {
  decade: string  // "1950s"
  stories: Story[]
  ageRange: string  // "Age 5-15"
}

// Grouping Logic
stories.groupBy(story => Math.floor(story.year / 10) * 10)
```

#### 2. **Book View**

```typescript
// Pagination Strategy
interface BookPage {
  leftContent: string   // Left page text
  rightContent: string  // Right page text
  splitIndex: number    // Paragraph split point
  photos: Photo[]       // Photos for this spread
  pageNumber: number
}

// Dual-page spreads with natural paragraph breaks
// Photos display with transforms (zoom, position)
```

#### 3. **Memory Card**

```typescript
interface MemoryCardProps {
  id: uuid
  title: string
  year?: number
  age?: number
  transcription: string
  photoUrl?: string
  photoTransform?: { zoom: number, position: {x, y} }
  photos?: Photo[]
  isFavorite: boolean
  lessonLearned?: string
  durationSeconds?: number
  emotions?: string[]
}

// Actions: Edit, Favorite/Unfavorite, Delete
```

#### 4. **Prompt Card**

```typescript
interface PromptCardProps {
  id: uuid
  promptText: string
  contextNote?: string
  tier: 0 | 1 | 2 | 3
  memoryType?: string
  promptScore?: number
  isLocked: boolean  // Paywall
  shownCount: number
}

// Actions: Queue for Later, Dismiss, Start Recording
```

### TanStack Query Patterns

**Query Keys:**
```typescript
['stories']                        // All stories for current context
['stories', storytellerId]         // Stories for specific user
['prompts', 'active']              // Active prompts
['prompts', 'queued']              // Queued prompts
['family', 'members']              // Family member list
['accounts', 'available']          // Available storyteller accounts
```

**Mutations:**
```typescript
useMutation({
  mutationFn: (story) => apiRequest('POST', '/api/stories', story),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['stories'] })
    queryClient.invalidateQueries({ queryKey: ['prompts', 'active'] })
  }
})
```

---

## Key Relationships

### 1. **User → Stories (One-to-Many)**
- A user can create unlimited stories
- Stories are scoped to `user_id`
- Multi-tenant access via `has_collaboration_access()` RPC

### 2. **User → Passkeys (One-to-Many)**
- A user can register multiple WebAuthn credentials
- Each credential is device-specific (Touch ID, Face ID, security key)
- Composite unique constraint prevents cross-user credential reuse

### 3. **Story → Prompts (Source Relationship)**
- A story can be created from a prompt (`source_prompt_id`)
- When story is saved, prompt moves to `prompt_history` with `outcome='used'`
- Tracks prompt effectiveness and ROI

### 4. **User → ActivePrompts (One-to-Many, Time-Limited)**
- User receives 1-5 active prompts at any time
- Prompts expire after 7 days
- Deduplication via `anchor_hash` prevents duplicates
- Tier 1: Generated after EVERY story (relationship templates)
- Tier 3: Generated at milestones [1, 2, 3, 4, 7, 10, 15, 20, 30, 50, 100]

### 5. **User → FamilyMembers (One-to-Many, Bidirectional)**
- As Storyteller: User invites family members to view their stories
- As Family Member: User registers via invite link, gains access to storyteller's account
- Permission levels: `viewer` (read-only) vs `contributor` (can submit questions)

### 6. **User → SharedAccess (One-to-Many)**
- User can create shareable links for timeline/book view
- Token-based access (no login required until `sharedWithUserId` is set)
- Optional expiration dates

### 7. **Story → Photos (Embedded JSONB Array)**
- Stories can have 0-10 photos (enforced in UI)
- Each photo has optional `transform` (zoom, position for cropping)
- One photo can be marked as `isHero` (primary display)

---

## Data Flow Patterns

### 1. **Story Creation → Prompt Generation Pipeline**

```
User Records Audio
  ↓
Upload to Supabase Storage
  ↓
Transcribe via AssemblyAI (3.7s batch)
  ↓
Extract Lesson (GPT-4o-mini, 3 options)
  ↓
User Adds Photos + Metadata
  ↓
Save Story to Database
  ↓
[IF AI Enabled]
  ↓
Generate Tier 1 Prompts (regex-based entity extraction)
  ↓
Generate Echo Prompt (GPT-4o-mini follow-up)
  ↓
Check for Milestone
  ↓
[IF Milestone] Trigger Tier 3 Analysis (background)
    ↓
    Fetch All User Stories
    ↓
    GPT-4o/GPT-5 Combined Analysis
    ↓
    Generate 2-5 High-Quality Prompts
    ↓
    Store in active_prompts (with paywall for Story 3+)
```

### 2. **Multi-Tenant Account Switching**

```
User Clicks Account Switcher
  ↓
Select Different Storyteller
  ↓
Verify Access via RPC: has_collaboration_access()
  ↓
Update AccountContext
  ↓
Save to localStorage
  ↓
Invalidate All Story Queries
  ↓
TanStack Query Refetches with storyteller_id parameter
  ↓
UI Updates with New Storyteller's Data
```

### 3. **Passkey Authentication**

```
User Clicks "Sign in with Passkey"
  ↓
GET /api/passkey/auth-options (fetch challenge)
  ↓
Browser WebAuthn API (biometric prompt)
  ↓
POST /api/passkey/auth-verify (verify signature)
  ↓
Supabase Auth Session Created
  ↓
Update signCount, lastUsedAt
  ↓
Return JWT token
```

### 4. **Photo Upload + Transform**

```
User Selects Photos (max 10)
  ↓
Client-side Preview Generation
  ↓
[Optional] Crop Tool (zoom, position)
  ↓
Sharp Processing (resize to 2400x2400, 85% quality)
  ↓
EXIF Stripping (privacy)
  ↓
Upload to Supabase Storage (heritage-whisper-files bucket)
  ↓
Return Public URL + Transform Metadata
  ↓
Store in story.photos JSONB array
```

### 5. **PDF Export**

```
User Clicks "Export as PDF"
  ↓
Choose Format (2-up vs Trim)
  ↓
Backend Fetches All Stories for storyteller_id
  ↓
Generate HTML with Photos + Transforms
  ↓
Send to PDFShift API
  ↓
PDFShift Renders PDF (11x8.5 or 5.5x8.5)
  ↓
Stream PDF to User
  ↓
Increment pdfExportsCount in users table
```

---

## Schema File Reference

**Primary Schema:** [`/shared/schema.ts`](../shared/schema.ts)

**Drizzle ORM Tables:**
- `users` - Main user accounts
- `passkeys` - WebAuthn credentials
- `stories` - User-generated content
- `activePrompts` - Current AI-generated prompts
- `promptHistory` - Archived prompts
- `familyMembers` - Family sharing relationships
- `familyActivity` - Family engagement tracking
- `sharedAccess` - Token-based sharing
- `profiles` - Extended user personalization
- `followUps` - Story-based follow-up questions
- `historicalContext` - Cached decade facts
- `userAgreements` - Legal agreement tracking
- `demoStories` - Demo account content

**Key RPC Functions:**
- `has_collaboration_access(p_user_id, p_storyteller_id)` - Multi-tenant access check
- `get_user_collaborations(p_user_id)` - List accessible storytellers

---

## Migration History

**Recent Schema Changes:**
- **January 2025:** Added `passkeys` table for WebAuthn support
- **January 2025:** Added `familyMembers` V3 multi-tenant system
- **October 2024:** Added `activePrompts` and `promptHistory` for AI prompt system
- **October 2024:** Added `userAgreements` for ToS/Privacy tracking
- **September 2024:** Added `profiles` for personalization settings

**See Also:**
- [`/migrations`](../migrations/) - All database migration files
- [`CLAUDE_HISTORY.md`](../CLAUDE_HISTORY.md) - Historical fixes and changes

---

_This data model documentation is synchronized with the codebase as of January 25, 2025._