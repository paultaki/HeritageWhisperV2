# Data Flow Patterns

> **Version:** 1.0  
> **Last Updated:** October 31, 2025  
> **Purpose:** Operation sequences and data flow documentation  
> **Related Documentation:** [DATA_MODEL.md](DATA_MODEL.md) | [SCHEMA_REFERENCE.md](SCHEMA_REFERENCE.md) | [ANTI_PATTERNS.md](ANTI_PATTERNS.md)

## Table of Contents

1. [Story Creation Flow](#story-creation-flow)
2. [Prompt Generation Flow](#prompt-generation-flow)
3. [Family Sharing Flow](#family-sharing-flow)
4. [Authentication Flows](#authentication-flows)
5. [Export Flows](#export-flows)
6. [AI Enhancement Flow](#ai-enhancement-flow)

---

## Story Creation Flow

### Complete Story Recording Pipeline

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. Start recording
       ▼
┌─────────────────────────────────────┐
│  POST /api/recording/start          │
│  - Create recording_session         │
│  - Store prompt context             │
└──────┬──────────────────────────────┘
       │ 2. Returns session_id
       ▼
┌─────────────────────────────────────┐
│  Client records audio               │
│  - MediaRecorder API                │
│  - Chunks stored locally            │
└──────┬──────────────────────────────┘
       │ 3. Stop recording
       ▼
┌─────────────────────────────────────┐
│  POST /api/upload/audio             │
│  - Validate file size (< 25MB)      │
│  - Upload to Supabase Storage       │
│  - Path: audio/{user_id}/{file}.m4a │
└──────┬──────────────────────────────┘
       │ 4. Returns audio_url
       ▼
┌─────────────────────────────────────┐
│  POST /api/transcribe-assemblyai    │
│  - Send audio to AssemblyAI         │
│  - Fast transcription (10-30s)      │
│  - Returns transcript               │
└──────┬──────────────────────────────┘
       │ 5. Returns transcript
       ▼
┌─────────────────────────────────────┐
│  POST /api/stories                  │
│  - Create story record              │
│  - status = 'recorded'              │
│  - Store audio_url, transcript      │
└──────┬──────────────────────────────┘
       │ 6. Returns story_id
       ▼
┌─────────────────────────────────────┐
│  Background: Story Enhancement      │
│  - Extract entities                 │
│  - Generate lesson learned          │
│  - Create followup questions        │
│  - Update status = 'enhanced'       │
└─────────────────────────────────────┘
```

### Database Operations

**Step 1: Create Recording Session**
```typescript
const { data: session } = await supabase
  .from('recording_sessions')
  .insert({
    user_id: userId,
    story_prompt: promptText,
    user_age: userAge,
    status: 'recording'
  })
  .select()
  .single();
```

**Step 4: Create Story**
```typescript
const { data: story } = await supabase
  .from('stories')
  .insert({
    user_id: userId,
    title: generatedTitle,
    audio_url: audioUrl,
    transcript: transcriptText,
    duration_seconds: duration,
    status: 'recorded',
    source_prompt_id: promptId  // Link to originating prompt
  })
  .select()
  .single();
```

**Step 5: Update User Story Count**
```typescript
await supabase
  .from('users')
  .update({ 
    story_count: sql`story_count + 1` 
  })
  .eq('id', userId);
```

---

## Prompt Generation Flow

### Tier 3 (Milestone) Prompt Generation

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. Request prompt
       ▼
┌─────────────────────────────────────┐
│  POST /api/prompts/next             │
│  - Check user budget                │
│  - Verify tier 3 cooldown           │
└──────┬──────────────────────────────┘
       │ 2. Check budget
       ▼
┌─────────────────────────────────────┐
│  RPC: check_ai_budget()             │
│  - Query ai_usage_log               │
│  - Daily: sum(cost_usd) < limit     │
│  - Monthly: sum(cost_usd) < limit   │
└──────┬──────────────────────────────┘
       │ 3. Budget OK
       ▼
┌─────────────────────────────────────┐
│  Fetch User Context                 │
│  - Get all stories                  │
│  - Get existing prompts             │
│  - Get user profile                 │
└──────┬──────────────────────────────┘
       │ 4. Context ready
       ▼
┌─────────────────────────────────────┐
│  OpenAI API Call                    │
│  - Model: gpt-4o                    │
│  - Generate 10 personalized prompts │
│  - Cost: ~$0.50                     │
└──────┬──────────────────────────────┘
       │ 5. Prompts generated
       ▼
┌─────────────────────────────────────┐
│  Process & Store Prompts            │
│  - Deduplicate (anchor_hash)        │
│  - Score quality (0-100)            │
│  - Insert to active_prompts         │
│  - Set tier = 3                     │
└──────┬──────────────────────────────┘
       │ 6. Log usage
       ▼
┌─────────────────────────────────────┐
│  RPC: log_ai_usage()                │
│  - Record cost                      │
│  - Record tokens used               │
│  - Timestamp operation              │
└──────┬──────────────────────────────┘
       │ 7. Update cooldown
       ▼
┌─────────────────────────────────────┐
│  Update User Record                 │
│  - last_tier2_attempt = NOW()       │
│  - Enforces 5-minute cooldown       │
└─────────────────────────────────────┘
```

### Deduplication Logic

**Anchor Hash Calculation:**
```typescript
function calculateAnchorHash(
  tier: number,
  entity: string | null,
  year: number | null
): string {
  const input = `${tier}-${entity || 'none'}-${year || 0}`;
  return crypto.createHash('sha1').update(input).digest('hex');
}
```

**Checking for Duplicates:**
```typescript
const { data: existing } = await supabase
  .from('active_prompts')
  .select('id')
  .eq('anchor_hash', anchorHash)
  .single();

if (existing) {
  // Skip this prompt, already exists
  continue;
}
```

---

## Family Sharing Flow

### Inviting a Family Member

```
┌─────────────┐
│ Storyteller │
└──────┬──────┘
       │ 1. Send invitation
       ▼
┌─────────────────────────────────────┐
│  POST /api/family/invite            │
│  - Validate email                   │
│  - Check existing invites           │
└──────┬──────────────────────────────┘
       │ 2. Create member
       ▼
┌─────────────────────────────────────┐
│  INSERT family_members              │
│  - user_id = storyteller            │
│  - email = family email             │
│  - status = 'pending'               │
│  - permission_level = 'viewer'      │
└──────┬──────────────────────────────┘
       │ 3. Generate token
       ▼
┌─────────────────────────────────────┐
│  INSERT family_invites              │
│  - token = random UUID              │
│  - expires_at = 7 days              │
│  - family_member_id = FK            │
└──────┬──────────────────────────────┘
       │ 4. Send email
       ▼
┌─────────────────────────────────────┐
│  Email Service                      │
│  - To: family member                │
│  - Link: /family/accept/{token}     │
└─────────────────────────────────────┘
```

### Accepting an Invitation

```
┌─────────────┐
│Family Member│
└──────┬──────┘
       │ 1. Click invite link
       ▼
┌─────────────────────────────────────┐
│  GET /family/accept/{token}         │
│  - Validate token                   │
│  - Check expiration                 │
└──────┬──────────────────────────────┘
       │ 2. Valid token
       ▼
┌─────────────────────────────────────┐
│  User Registration/Login            │
│  - Create account if new            │
│  - Or login if existing             │
└──────┬──────────────────────────────┘
       │ 3. Authenticated
       ▼
┌─────────────────────────────────────┐
│  UPDATE family_members              │
│  - auth_user_id = user.id           │
│  - status = 'active'                │
│  - first_accessed_at = NOW()        │
└──────┬──────────────────────────────┘
       │ 4. Create collaboration
       ▼
┌─────────────────────────────────────┐
│  INSERT family_collaborations       │
│  - family_member_id = FK            │
│  - storyteller_user_id = FK         │
│  - status = 'active'                │
│  - permission_level = 'viewer'      │
└──────┬──────────────────────────────┘
       │ 5. Mark invite used
       ▼
┌─────────────────────────────────────┐
│  UPDATE family_invites              │
│  - used_at = NOW()                  │
└──────┬──────────────────────────────┘
       │ 6. Redirect
       ▼
┌─────────────────────────────────────┐
│  Navigate to Storyteller's Timeline │
│  - Access controlled by RLS         │
│  - Uses has_collaboration_access()  │
└─────────────────────────────────────┘
```

### Multi-Tenant Access Check

**Every story access checks:**
```typescript
// Server-side: Check if user can access storyteller's data
const { data: hasAccess } = await supabase.rpc('has_collaboration_access', {
  p_user_id: currentUser.id,
  p_storyteller_id: storytellerUserId
});

if (!hasAccess) {
  return NextResponse.json(
    { error: 'Access denied' },
    { status: 403 }
  );
}

// Proceed with data access
const { data: stories } = await supabase
  .from('stories')
  .select('*')
  .eq('user_id', storytellerUserId);  // Access storyteller's stories
```

---

## Authentication Flows

### Password Login

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. Submit credentials
       ▼
┌─────────────────────────────────────┐
│  POST /api/auth/login               │
│  - Rate limit check (5/10s)         │
│  - Validate email format            │
└──────┬──────────────────────────────┘
       │ 2. Authenticate
       ▼
┌─────────────────────────────────────┐
│  Supabase Auth                      │
│  - signInWithPassword()             │
│  - Returns session + tokens         │
└──────┬──────────────────────────────┘
       │ 3. Session created
       ▼
┌─────────────────────────────────────┐
│  Fetch User Profile                 │
│  - Query users table                │
│  - Get preferences, settings        │
└──────┬──────────────────────────────┘
       │ 4. Check Remember Me
       ▼
┌─────────────────────────────────────┐
│  Session Management                 │
│  - If Remember Me = true:           │
│    * Store in localStorage          │
│    * 7-day token expiry             │
│  - If Remember Me = false:          │
│    * Store in sessionStorage        │
│    * 30-min inactivity timeout      │
│    * Clear on browser close         │
└──────┬──────────────────────────────┘
       │ 5. Return user data
       ▼
┌─────────────────────────────────────┐
│  Client Side                        │
│  - Store session in context         │
│  - Start activity tracker           │
│  - Navigate to timeline             │
└─────────────────────────────────────┘
```

### Passkey Login (WebAuthn)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. Request passkey login
       ▼
┌─────────────────────────────────────┐
│  POST /api/auth/passkey/challenge   │
│  - Generate challenge nonce         │
│  - Store in iron-session           │
└──────┬──────────────────────────────┘
       │ 2. Returns challenge
       ▼
┌─────────────────────────────────────┐
│  Browser WebAuthn API               │
│  - navigator.credentials.get()      │
│  - User authenticates (Touch ID)    │
│  - Returns signed assertion         │
└──────┬──────────────────────────────┘
       │ 3. Submit assertion
       ▼
┌─────────────────────────────────────┐
│  POST /api/auth/passkey/verify      │
│  - Verify signature                 │
│  - Check sign count                 │
│  - Update passkey record            │
└──────┬──────────────────────────────┘
       │ 4. Create session
       ▼
┌─────────────────────────────────────┐
│  Mint Custom JWT                    │
│  - mintRLSJwt(userId)               │
│  - Supabase-compatible format       │
│  - Store in httpOnly cookie         │
└──────┬──────────────────────────────┘
       │ 5. Update passkey
       ▼
┌─────────────────────────────────────┐
│  UPDATE passkeys                    │
│  - sign_count += 1                  │
│  - last_used_at = NOW()             │
└──────┬──────────────────────────────┘
       │ 6. Return success
       ▼
┌─────────────────────────────────────┐
│  Client Side                        │
│  - Session established              │
│  - Navigate to timeline             │
└─────────────────────────────────────┘
```

---

## Export Flows

### PDF Book Export

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. Request PDF export
       ▼
┌─────────────────────────────────────┐
│  POST /api/export/book              │
│  - Check export limits              │
│  - Rate limit: 5/hour               │
└──────┬──────────────────────────────┘
       │ 2. Fetch stories
       ▼
┌─────────────────────────────────────┐
│  Query Stories                      │
│  - WHERE include_in_book = true     │
│  - ORDER BY story_year ASC          │
│  - Include photos, transcripts      │
└──────┬──────────────────────────────┘
       │ 3. Generate HTML
       ▼
┌─────────────────────────────────────┐
│  Build HTML Template                │
│  - Cover page                       │
│  - Table of contents                │
│  - Stories with photos              │
│  - Timeline visualization           │
└──────┬──────────────────────────────┘
       │ 4. Convert to PDF
       ▼
┌─────────────────────────────────────┐
│  PDFShift API                       │
│  - POST HTML content                │
│  - Rendering settings               │
│  - Returns PDF buffer               │
└──────┬──────────────────────────────┘
       │ 5. Upload PDF
       ▼
┌─────────────────────────────────────┐
│  Supabase Storage                   │
│  - Bucket: exports                  │
│  - Path: pdf/{user_id}/{date}.pdf   │
└──────┬──────────────────────────────┘
       │ 6. Track export
       ▼
┌─────────────────────────────────────┐
│  UPDATE users                       │
│  - pdf_exports_count += 1           │
│  - last_pdf_export_at = NOW()       │
└──────┬──────────────────────────────┘
       │ 7. Return download URL
       ▼
┌─────────────────────────────────────┐
│  Generate Signed URL                │
│  - createSignedUrl(path, 3600)      │
│  - 1-hour expiry                    │
└─────────────────────────────────────┘
```

### Data Export (JSON)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. Request data export
       ▼
┌─────────────────────────────────────┐
│  POST /api/user/export              │
│  - Check export limits              │
│  - Rate limit: 3/day                │
└──────┬──────────────────────────────┘
       │ 2. Fetch all data
       ▼
┌─────────────────────────────────────┐
│  Query All User Data                │
│  - stories (all fields)             │
│  - active_prompts                   │
│  - user_prompts                     │
│  - family_members                   │
│  - profile data                     │
└──────┬──────────────────────────────┘
       │ 3. Format export
       ▼
┌─────────────────────────────────────┐
│  Build Export JSON                  │
│  {                                  │
│    "export_date": "2025-10-31",     │
│    "user": {...},                   │
│    "stories": [...],                │
│    "prompts": [...],                │
│    "family": [...]                  │
│  }                                  │
└──────┬──────────────────────────────┘
       │ 4. Track export
       ▼
┌─────────────────────────────────────┐
│  UPDATE users                       │
│  - data_exports_count += 1          │
│  - last_data_export_at = NOW()      │
└──────┬──────────────────────────────┘
       │ 5. Return JSON
       ▼
┌─────────────────────────────────────┐
│  Client Download                    │
│  - Filename: heritagewhisper-data-  │
│    {date}.json                      │
│  - Content-Type: application/json   │
└─────────────────────────────────────┘
```

---

## AI Enhancement Flow

### Story Enhancement Pipeline

```
┌─────────────┐
│Story Created│
└──────┬──────┘
       │ 1. Story saved (status: recorded)
       ▼
┌─────────────────────────────────────┐
│  Background Job Triggered           │
│  - Queue: story-enhancement         │
│  - Job ID stored in story           │
└──────┬──────────────────────────────┘
       │ 2. Extract entities
       ▼
┌─────────────────────────────────────┐
│  OpenAI: Entity Extraction          │
│  - Model: gpt-4o-mini               │
│  - Extract people, places, dates    │
│  - Cost: ~$0.05                     │
└──────┬──────────────────────────────┘
       │ 3. Generate lesson
       ▼
┌─────────────────────────────────────┐
│  OpenAI: Lesson Generation          │
│  - Identify key insight             │
│  - Generate alternatives            │
│  - Cost: ~$0.10                     │
└──────┬──────────────────────────────┘
       │ 4. Create followups
       ▼
┌─────────────────────────────────────┐
│  OpenAI: Followup Questions         │
│  - Generate 3-5 questions           │
│  - Emotional, wisdom, sensory       │
│  - Cost: ~$0.05                     │
└──────┬──────────────────────────────┘
       │ 5. Update story
       ▼
┌─────────────────────────────────────┐
│  UPDATE stories                     │
│  - entities_extracted = {...}       │
│  - lesson_learned = "..."           │
│  - followups_initial = [...]        │
│  - status = 'enhanced'              │
└──────┬──────────────────────────────┘
       │ 6. Log usage
       ▼
┌─────────────────────────────────────┐
│  RPC: log_ai_usage()                │
│  - operation = 'story_enhancement'  │
│  - cost_usd = 0.20                  │
│  - tokens_used = ~2500              │
└─────────────────────────────────────┘
```

---

## Performance Considerations

### Caching Strategy

**User Profile:**
- Cache in React Context
- TTL: Session duration
- Invalidate: On profile update

**Stories List:**
- Cache in TanStack Query
- TTL: 5 minutes
- Invalidate: On story create/update

**Active Prompts:**
- Cache in TanStack Query
- TTL: 1 minute
- Invalidate: On prompt action (skip, queue, dismiss)

### Pagination Patterns

**Stories Timeline:**
```typescript
// Infinite scroll with 20 items per page
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ['stories', userId],
  queryFn: async ({ pageParam = 0 }) => {
    const from = pageParam * 20;
    const to = from + 19;
    
    const { data } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    return data;
  },
  getNextPageParam: (lastPage, allPages) => {
    return lastPage?.length === 20 ? allPages.length : undefined;
  }
});
```

---

**Related Documentation:**
- [DATA_MODEL.md](DATA_MODEL.md) - Overview and quick reference
- [SCHEMA_REFERENCE.md](SCHEMA_REFERENCE.md) - Detailed table documentation
- [RPC_FUNCTIONS.md](RPC_FUNCTIONS.md) - Database functions
- [ANTI_PATTERNS.md](ANTI_PATTERNS.md) - Common mistakes to avoid

---

_Last updated: October 31, 2025 - Based on current HeritageWhisper operation flows_

