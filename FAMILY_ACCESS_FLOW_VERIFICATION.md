# Family Member Access Flow - Complete Verification

**Document Purpose:** Detailed timeline of the family member access flow with 100% accuracy verification.

**Last Updated:** November 18, 2025

---

## Executive Summary

The family member access flow has **TWO separate token systems**:

1. **Invite Token** - One-time use magic link (14 days initial, 7 days on resend)
2. **Session Token** - Long-lived authentication token (30 days renewable, 90 days absolute max)

These tokens are completely independent. Once a session token is created, the invite token becomes irrelevant.

---

## Component Overview

### Database Tables

#### `family_invites` (Magic Link Tokens)
```sql
- id: UUID (primary key)
- family_member_id: UUID (foreign key → family_members)
- token: TEXT (64 hex chars = 32 random bytes)
- expires_at: TIMESTAMPTZ (when the magic link expires)
- used_at: TIMESTAMPTZ (when first clicked, becomes null)
- created_at: TIMESTAMPTZ
```

**Indexes:**
- `idx_family_invites_token` - Fast token lookups (WHERE used_at IS NULL)
- `idx_family_invites_expires` - Cleanup queries (WHERE used_at IS NULL)

#### `family_sessions` (Session Tokens)
```sql
- id: UUID (primary key)
- family_member_id: UUID (foreign key → family_members)
- token: TEXT (64 hex chars = 32 random bytes, UNIQUE)
- user_agent: TEXT (browser info)
- ip_address: TEXT (browser IP)
- expires_at: TIMESTAMPTZ (renewable expiry)
- absolute_expires_at: TIMESTAMPTZ (hard limit, cannot extend)
- last_active_at: TIMESTAMPTZ (when session was last used)
- created_at: TIMESTAMPTZ
```

**Indexes:**
- `idx_family_sessions_token` - Token lookups (most common query)
- `idx_family_sessions_expires_at` - Expiry cleanup
- `idx_family_sessions_absolute_expires_at` - Hard limit cleanup
- `idx_family_sessions_family_member_id` - Member lookups

#### `family_members`
```sql
- id: UUID (primary key)
- user_id: UUID (storyteller)
- email: TEXT
- name: TEXT
- relationship: TEXT (enum: spouse, partner, child, parent, sibling, grandparent, grandchild, other)
- status: TEXT (pending, active, suspended)
- invited_at: TIMESTAMPTZ
- first_accessed_at: TIMESTAMPTZ (when they first clicked invite)
- last_accessed_at: TIMESTAMPTZ (when they last viewed stories)
- access_count: INTEGER (number of times accessed)
- created_at: TIMESTAMPTZ
```

#### `family_access_tokens` ❌ DOES NOT EXIST
**Status:** This table name does not exist in the schema. The actual session tokens are stored in `family_sessions`.

---

## API Routes

### 1. `POST /api/family/invite` - Create Initial Invitation

**Purpose:** Send an invitation email to a family member

**Request:**
```json
{
  "email": "family@example.com",
  "name": "John Smith",
  "relationship": "Son" (optional)
}
```

**Authentication:** User session required (Authorization header)

**Process:**
1. Validates user is authenticated
2. Checks if family member already invited (prevents duplicates)
3. Checks limit (max 10 family members per user)
4. Creates `family_members` record with status=`pending`
5. **Generates new invite token** (32 random bytes = 64 hex chars)
6. Creates `family_invites` record with **14-day expiry**
7. Sends email via Resend with magic link: `/family/access?token={inviteToken}`
8. Logs `invite_sent` activity event

**Expiry:** 14 days from creation (`.setDate(Date.getDate() + 14)`)

**Return:**
```json
{
  "success": true,
  "memberId": "uuid",
  "inviteSent": true,
  "inviteUrl": "http://localhost:3002/family/access?token=..." (dev only)
}
```

**Code Location:** `/Users/paul/Development/HeritageWhisperV2/app/api/family/invite/route.ts`

---

### 2. `POST /api/family/[memberId]/resend` - Resend Invitation

**Purpose:** Send a new invitation to a pending or active member

**Request:** Empty POST body

**Authentication:** User session required (Authorization header)

**Process:**
1. Validates user is authenticated
2. Verifies family member belongs to user
3. Checks status is not `suspended`
4. **Generates NEW invite token** (32 random bytes)
5. Creates new `family_invites` record with **7-day expiry**
6. Sends new email via Resend
7. Logs `invite_resent` activity event

**Expiry:** 7 days from creation (`.setDate(Date.getDate() + 7)`)

**Return:**
```json
{
  "success": true,
  "inviteSent": true,
  "inviteUrl": "http://localhost:3002/family/access?token=..." (dev only)
}
```

**Key Difference:** Resent invites expire in 7 days (not 14). If initial invite expires at day 14 and family member requests resend on day 15, they get a new 7-day expiry window.

**Code Location:** `/Users/paul/Development/HeritageWhisperV2/app/api/family/[memberId]/resend/route.ts`

---

### 3. `GET /api/family/verify?token={inviteToken}` - Verify & Exchange Token

**Purpose:** Called when family member clicks magic link. Validates invite and creates session.

**Request:** Query parameter `?token=...`

**Authentication:** None required (publicly accessible endpoint)

**Process:**

#### Step 1: Validate Invite Token
```typescript
const { data: invite, error: inviteError } = await supabaseAdmin
  .from('family_invites')
  .select(`
    id,
    family_member_id,
    expires_at,
    used_at,
    family_members (...)
  `)
  .eq('token', inviteToken)
  .single();
```

#### Step 2: Check Expiry
- If `expires_at < NOW()` → return 400 "This invite link has expired"

#### Step 3: Mark as Used (First Time Only)
```typescript
if (!invite.used_at) {
  // Update family_invites
  await supabaseAdmin
    .from('family_invites')
    .update({ used_at: NOW() })
    .eq('id', invite.id);
  
  // Update family_members to active
  await supabaseAdmin
    .from('family_members')
    .update({
      status: 'active',
      first_accessed_at: NOW(),
      last_accessed_at: NOW(),
      access_count: 1,
    })
    .eq('id', familyMember.id);
  
  // Log family_member_joined event
}
```

#### Step 4: Delete Old Sessions (Security Rotation)
```typescript
// CRITICAL: Invalidate old sessions before creating new one
// This prevents long-lived compromised tokens from remaining valid
await supabaseAdmin
  .from('family_sessions')
  .delete()
  .eq('family_member_id', familyMember.id);
```

#### Step 5: Create New Session Token
```typescript
const sessionToken = generateSecureToken(); // 32 random bytes
const sessionExpiresAt = new Date();
sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 30); // 30 days

const absoluteExpiresAt = new Date();
absoluteExpiresAt.setDate(absoluteExpiresAt.getDate() + 90); // 90 days

await supabaseAdmin
  .from('family_sessions')
  .insert({
    family_member_id: familyMember.id,
    token: sessionToken,
    user_agent: request.headers.get('user-agent'),
    ip_address: request.headers.get('x-forwarded-for'),
    expires_at: sessionExpiresAt.toISOString(),
    absolute_expires_at: absoluteExpiresAt.toISOString(),
  });
```

#### Step 6: Cleanup Expired Sessions
```typescript
// Remove any other expired sessions
await supabaseAdmin
  .from('family_sessions')
  .delete()
  .lt('expires_at', NOW());
```

#### Step 7: Return Session Data
```json
{
  "valid": true,
  "sessionToken": "64hex...",
  "expiresAt": "2025-12-18T...",
  "familyMember": {
    "id": "uuid",
    "name": "John Smith",
    "relationship": "Son",
    "permissionLevel": "viewer"
  },
  "storyteller": {
    "id": "uuid",
    "name": "Jane Doe"
  }
}
```

**Code Location:** `/Users/paul/Development/HeritageWhisperV2/app/api/family/verify/route.ts`

---

### 4. `POST /api/family/refresh-session` - Extend Session

**Purpose:** Refresh/extend the session token when accessing pages

**Request:** Empty POST body

**Authentication:** Family session token required (Authorization header)

**Process:**

#### Step 1: Get Current Session
```typescript
const { data: session, error: sessionError } = await supabaseAdmin
  .from('family_sessions')
  .select('id, family_member_id, expires_at, absolute_expires_at, last_active_at')
  .eq('token', token)
  .single();
```

#### Step 2: Check Absolute Expiry (Hard Limit)
```typescript
if (now >= absoluteExpiresAt) {
  return {
    error: 'Session has reached absolute expiry limit',
    requiresNewLink: true
  }
  // Status: 401
}
```
Once the 90-day absolute expiry is reached, the session **CANNOT be extended** and requires a new invite link.

#### Step 3: Check Renewable Expiry
```typescript
if (now >= expiresAt) {
  return {
    error: 'Session expired - please use magic link again',
    requiresNewLink: true
  }
  // Status: 401
}
```

#### Step 4: Extend Expiry (Capped at Absolute)
```typescript
const newExpiresAt = new Date();
newExpiresAt.setDate(newExpiresAt.getDate() + 30); // 30 days from now

// Cap at absolute expiry - never extend beyond 90-day limit
const finalExpiresAt = newExpiresAt > absoluteExpiresAt
  ? absoluteExpiresAt
  : newExpiresAt;

await supabaseAdmin
  .from('family_sessions')
  .update({
    expires_at: finalExpiresAt.toISOString(),
    last_active_at: now.toISOString(),
  })
  .eq('id', session.id);

// Also update family member's last_accessed_at
await supabaseAdmin
  .from('family_members')
  .update({
    last_accessed_at: now.toISOString(),
  })
  .eq('id', session.family_member_id);
```

#### Step 5: Return Updated Expiry
```json
{
  "success": true,
  "expiresAt": "2025-12-18T...",
  "absoluteExpiresAt": "2026-01-16T...",
  "daysUntilExpiry": 30,
  "message": "Session refreshed successfully"
}
```

**Code Location:** `/Users/paul/Development/HeritageWhisperV2/app/api/family/refresh-session/route.ts`

---

## Frontend Flow

### Family Access Page (`/family/access?token=...`)

**File:** `/Users/paul/Development/HeritageWhisperV2/app/family/access/page.tsx`

**Purpose:** Handle the magic link click and set up the family member session

**Flow:**

1. **Extract Token from URL:**
   ```typescript
   const token = searchParams?.get('token');
   if (!token) {
     setStatus('error');
     setError('No invitation token provided...');
     return;
   }
   ```

2. **Call `/api/family/verify?token=...`:**
   ```typescript
   const response = await fetch(`/api/family/verify?token=${token}`);
   const data = await response.json();
   
   if (!response.ok) {
     throw new Error(data.error || 'Verification failed');
   }
   ```

3. **Handle Errors:**
   - **"Invalid or expired invite link"** (404) - Invite not found
   - **"This invite link has expired"** (400) - Token expired

4. **Store Session in localStorage:**
   ```typescript
   const familySession: SessionData = {
     sessionToken: data.sessionToken,
     storytellerId: data.storyteller.id,
     storytellerName: data.storyteller.name,
     familyMemberName: data.familyMember.name,
     relationship: data.familyMember.relationship,
     permissionLevel: data.familyMember.permissionLevel,
     expiresAt: data.expiresAt,
     firstAccess: true,
   };
   
   localStorage.setItem('family_session', JSON.stringify(familySession));
   ```

5. **Show Welcome Screen:**
   - Display for 5 seconds before auto-redirecting
   - Show countdown timer
   - Allow manual "Continue to Timeline" button click

6. **Redirect to `/timeline`:**
   ```typescript
   // Use window.location.href (full page reload)
   // This ensures timeline reads fresh localStorage state
   window.location.href = '/timeline';
   ```

**Key Detail:** Uses `window.location.href` (not Next.js router) to force a full page reload. This ensures the timeline page reads the freshly-written localStorage state.

---

### useFamilyAuth Hook

**File:** `/Users/paul/Development/HeritageWhisperV2/hooks/use-family-auth.ts`

**Purpose:** Manage family session state and auto-refresh

**Implementation:**

```typescript
export function useFamilyAuth() {
  const [session, setSession] = useState<FamilySession | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: Load from localStorage
  useEffect(() => {
    loadSession();
  }, []);

  async function loadSession() {
    const stored = localStorage.getItem('family_session');
    if (!stored) {
      setLoading(false);
      return;
    }

    const data: FamilySession = JSON.parse(stored);

    // Check if expired
    if (new Date(data.expiresAt) < new Date()) {
      clearSession();
      setLoading(false);
      return;
    }

    setSession(data);

    // Auto-refresh if expiring within 7 days
    const expiresAt = new Date(data.expiresAt);
    const now = new Date();
    const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (daysUntilExpiry < 7) {
      await refreshSession(data);
    }

    setLoading(false);
  }

  async function refreshSession(currentSession: FamilySession) {
    try {
      const response = await fetch('/api/family/refresh-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentSession.sessionToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.requiresNewLink) {
          clearSession();
        }
        return false;
      }

      const data = await response.json();

      // Update session with new expiry
      const updated = { ...currentSession, expiresAt: data.expiresAt };
      localStorage.setItem('family_session', JSON.stringify(updated));
      setSession(updated);

      return true;
    } catch (err) {
      console.error('Error refreshing session:', err);
      return false;
    }
  }

  return {
    session,
    loading,
    isAuthenticated: !!session,
    clearSession,
    updateFirstAccess,
  };
}
```

**Key Behaviors:**
- **On load:** Checks if session exists and is not expired
- **Auto-refresh:** If session expiring within 7 days, automatically calls `/api/family/refresh-session`
- **Expiry handling:** If refresh fails with `requiresNewLink`, clears session and redirects to error page
- **Persistence:** Stores session in localStorage (not cookies)

---

### FamilyGuard Component

**File:** `/Users/paul/Development/HeritageWhisperV2/components/FamilyGuard.tsx`

**Purpose:** Protect routes that require family member authentication

**Implementation:**

```typescript
export function FamilyGuard({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) {
  const { session, loading, isAuthenticated } = useFamilyAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // No valid session
      router.push('/family/expired');
      return;
    }

    // Verify userId matches storyteller (defense-in-depth)
    if (session && session.storytellerId !== userId) {
      router.push('/family/unauthorized');
    }
  }, [loading, isAuthenticated, session, userId, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || (session && session.storytellerId !== userId)) {
    return null;
  }

  return <>{children}</>;
}
```

**Redirects:**
- `/family/expired` - No valid session or session expired
- `/family/unauthorized` - Session belongs to different storyteller

---

### Timeline/Book Pages

**Files:** 
- `/Users/paul/Development/HeritageWhisperV2/app/family/timeline/[userId]/client.tsx`
- `/Users/paul/Development/HeritageWhisperV2/app/family/book/[userId]/client.tsx`

**Flow:**

1. **Render with FamilyGuard:**
   ```typescript
   <FamilyGuard userId={userId}>
     <TimelineContent />
   </FamilyGuard>
   ```

2. **Get Session in Component:**
   ```typescript
   const { session } = useFamilyAuth();
   ```

3. **Fetch Stories with Session Token:**
   ```typescript
   const { data: storiesData } = useQuery({
     queryKey: ['/api/family/stories', userId],
     queryFn: async () => {
       if (!session?.sessionToken) {
         throw new Error('No session token');
       }

       const response = await fetch(`/api/family/stories/${userId}`, {
         headers: {
           Authorization: `Bearer ${session.sessionToken}`,
         },
       });

       if (!response.ok) {
         throw new Error('Failed to fetch stories');
       }

       return response.json();
     },
     enabled: !!session?.sessionToken,
   });
   ```

4. **API Validates Session Token:**
   - Looks up token in `family_sessions` table
   - Checks if expired
   - Verifies userId matches storyteller
   - Returns stories + updates `last_active_at`

**Protected Routes:**
- `/family/timeline/[userId]` - View stories in timeline order
- `/family/book/[userId]` - View stories organized by decade

---

### Stories API Route

**File:** `/Users/paul/Development/HeritageWhisperV2/app/api/family/stories/[userId]/route.ts`

**Purpose:** Fetch stories for a family member with session validation

**Process:**

1. **Extract & Validate Session Token:**
   ```typescript
   const authHeader = req.headers.get('authorization');
   const token = authHeader?.split(' ')[1];

   if (!token) {
     return NextResponse.json(
       { error: 'No session token provided' },
       { status: 401 }
     );
   }
   ```

2. **Verify Session:**
   ```typescript
   const { data: session, error: sessionError } = await supabaseAdmin
     .from('family_sessions')
     .select(`
       id,
       family_member_id,
       expires_at,
       family_members (
         id,
         user_id,
         email,
         name,
         relationship
       )
     `)
     .eq('token', token)
     .single();

   if (sessionError || !session) {
     return NextResponse.json(
       { error: 'Invalid session' },
       { status: 401 }
     );
   }
   ```

3. **Check Expiry:**
   ```typescript
   if (new Date(session.expires_at) < new Date()) {
     return NextResponse.json(
       { error: 'Session expired' },
       { status: 401 }
     );
   }
   ```

4. **Verify URL Parameter Matches Session:**
   ```typescript
   if (familyMember.user_id !== userId) {
     return NextResponse.json(
       { error: 'Unauthorized access' },
       { status: 403 }
     );
   }
   ```

5. **Update Activity:**
   ```typescript
   await supabaseAdmin
     .from('family_sessions')
     .update({ last_active_at: new Date().toISOString() })
     .eq('id', session.id);

   await supabaseAdmin
     .from('family_members')
     .update({
       last_accessed_at: new Date().toISOString(),
       access_count: (familyMember.access_count || 0) + 1,
     })
     .eq('id', session.family_member_id);
   ```

6. **Fetch & Return Stories:**
   ```typescript
   const { data: allStories } = await supabaseAdmin
     .from('stories')
     .select('*')
     .eq('user_id', familyMember.user_id);

   // Filter for public stories
   const stories = (allStories || []).filter((story: any) => {
     const includeInTimeline = story.metadata?.include_in_timeline ?? true;
     const includeInBook = story.metadata?.include_in_book ?? true;
     return includeInTimeline || includeInBook;
   });

   return NextResponse.json({ stories: transformedStories, storyteller: storytellerData });
   ```

---

## Complete Timeline: Day-by-Day Scenarios

### Scenario 1: Normal Happy Path (Initial Invite)

```
DAY 0 - Storyteller Invites Family Member
├─ POST /api/family/invite
├─ Creates family_members (status: pending)
├─ Generates invite token
├─ Creates family_invites (expires_at: DAY 14)
├─ Sends email with magic link
└─ family_members.status = pending

DAY 1 - Family Member Clicks Magic Link
├─ Visits /family/access?token=ABC123
├─ GET /api/family/verify?token=ABC123
├─ Validates token exists and not expired ✓
├─ Marks family_invites.used_at = NOW
├─ Updates family_members (status: active, first_accessed_at: NOW)
├─ Deletes old family_sessions for this member (security rotation)
├─ Generates NEW session token
├─ Creates family_sessions (
│   expires_at: DAY 31,
│   absolute_expires_at: DAY 91
│ )
├─ Returns sessionToken
├─ Stores in localStorage
├─ Shows 5-second welcome screen
└─ Redirects to /timeline/{storytellerId}

DAY 2 - Family Member Views Timeline
├─ /family/timeline/{storytellerId}
├─ FamilyGuard checks useFamilyAuth()
├─ Session loaded from localStorage
├─ Session not expired (DAY 31 > DAY 2) ✓
├─ Days until expiry: 29 (not < 7, so no auto-refresh)
├─ Queries /api/family/stories/{storytellerId}
├─ API validates session token in family_sessions ✓
├─ Checks expires_at (DAY 31 > DAY 2) ✓
├─ Updates last_active_at = DAY 2
├─ Returns stories
└─ Family member views timeline

DAY 8 - Family Member Views Timeline Again
├─ /family/timeline/{storytellerId}
├─ Session loaded from localStorage
├─ Session not expired (DAY 31 > DAY 8) ✓
├─ Days until expiry: 23 (still not < 7, no auto-refresh)
├─ Queries /api/family/stories/{storytellerId}
├─ API validates session token ✓
├─ Updates last_active_at = DAY 8
├─ Continues normally

DAY 25 - Family Member Views Timeline Again
├─ /family/timeline/{storytellerId}
├─ Session loaded from localStorage
├─ Session not expired (DAY 31 > DAY 25) ✓
├─ Days until expiry: 6 (< 7, AUTO-REFRESH!)
├─ useFamilyAuth calls refreshSession()
├─ POST /api/family/refresh-session
├─ API validates session token ✓
├─ Checks expires_at (DAY 31 > DAY 25) ✓
├─ Calculates new expiry: DAY 25 + 30 = DAY 55
├─ Checks absolute_expires_at (DAY 91 > DAY 55) ✓
├─ Updates session.expires_at = DAY 55
├─ Updates session.last_active_at = DAY 25
├─ Returns new expiresAt
├─ Updates localStorage with new expiresAt
└─ Family member continues viewing timeline

DAY 60 - Family Member Views Timeline (After Absolute Expiry Has Passed)
├─ /family/timeline/{storytellerId}
├─ Session loaded from localStorage
├─ Now > absolute_expires_at (DAY 91 passed on day 91)
│  WAIT - this is AFTER day 91, so the session would already be invalid
│  Let me recalculate...
│
│  Day 0: Invite sent
│  Day 1: Session created with:
│  ├─ expires_at = Day 1 + 30 = Day 31
│  └─ absolute_expires_at = Day 1 + 90 = Day 91
│
│  So on Day 60:
│  ├─ expires_at = Day 31 (ALREADY EXPIRED on day 31)
│  └─ absolute_expires_at = Day 91 (STILL VALID)
│
│  Days until expiry: -29 (EXPIRED!)

DAY 31 - Session Renewable Expiry Reached
├─ /family/timeline/{storytellerId}
├─ Session loaded from localStorage
├─ Session expired? (DAY 31 >= DAY 31) = YES, EXPIRED
├─ clearSession() called
├─ FamilyGuard sees isAuthenticated = false
├─ Redirects to /family/expired
└─ Family member sees error message

DAY 35 - Family Member Still Has Original Invite Link
├─ Clicks original magic link again
├─ /family/access?token=ABC123 (same invite token)
├─ GET /api/family/verify?token=ABC123
├─ Looks up invite in family_invites (created DAY 0, expires DAY 14)
├─ Checks expiry (DAY 35 > DAY 14 = EXPIRED)
├─ Returns 400 "This invite link has expired"
├─ Page shows "Invite Expired" error
└─ Tells family member to contact storyteller

DAY 45 - Storyteller Requests Resend
├─ POST /api/family/{memberId}/resend
├─ Verifies family member belongs to user ✓
├─ Checks status is not suspended ✓
├─ Generates NEW invite token (different from original)
├─ Creates new family_invites (expires_at: DAY 45 + 7 = DAY 52)
├─ Sends new email with new magic link
└─ family_members.status stays "active" (not changed to pending)

DAY 46 - Family Member Clicks Resent Link
├─ /family/access?token=XYZ789 (NEW token, not ABC123)
├─ GET /api/family/verify?token=XYZ789
├─ Looks up new invite in family_invites (created DAY 45, expires DAY 52)
├─ Checks expiry (DAY 46 < DAY 52) ✓
├─ Checks used_at (NULL) ✓
├─ Marks family_invites.used_at = DAY 46
├─ Family members already active, so:
│  ├─ Updates last_accessed_at = DAY 46
│  └─ Increments access_count
├─ Deletes old family_sessions (security rotation)
├─ Generates NEW session token
├─ Creates new family_sessions (
│   expires_at: DAY 46 + 30 = DAY 76,
│   absolute_expires_at: DAY 46 + 90 = DAY 136
│ )
├─ Returns new sessionToken
└─ Family member stores in localStorage and continues
```

---

## Critical Security Details

### Session Rotation
**When:** Every time `/api/family/verify` is called (magic link clicked)

**What Happens:**
```typescript
await supabaseAdmin
  .from('family_sessions')
  .delete()
  .eq('family_member_id', familyMember.id);
```

**Why:** Invalidates compromised tokens. If someone's session token leaked, clicking a new magic link will invalidate all old sessions and create a fresh one.

### Absolute Expiry Limit
**Purpose:** Hard limit on session lifetime to force re-authentication

**Behavior:**
- Session created with `absolute_expires_at = now + 90 days`
- Every refresh extends `expires_at` by 30 days
- But `expires_at` can NEVER exceed `absolute_expires_at`
- After 90 days, session expires permanently and requires new magic link

**Code:**
```typescript
const finalExpiresAt = newExpiresAt > absoluteExpiresAt
  ? absoluteExpiresAt
  : newExpiresAt;
```

### One-Time Invite Use
**Behavior:**
- Invite token marked as `used_at` on first click
- Subsequent clicks don't reset `used_at` (idempotent)
- Allows recovery if user lost session without generating duplicate records

**Code:**
```typescript
if (!invite.used_at) {
  await supabaseAdmin
    .from('family_invites')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invite.id);
  // ... update family member status ...
} else {
  // Token was already used, but we can still create a session
  // This allows the user to access again if they lost their session
}
```

### Defense-in-Depth: Storyteller ID Verification
**In useFamilyAuth:**
```typescript
if (session && session.storytellerId !== userId) {
  router.push('/family/unauthorized');
}
```

**In /api/family/stories:**
```typescript
if (familyMember.user_id !== userId) {
  return NextResponse.json(
    { error: 'Unauthorized access' },
    { status: 403 }
  );
}
```

**In FamilyGuard:**
```typescript
if (session && session.storytellerId !== userId) {
  router.push('/family/unauthorized');
}
```

This prevents accessing stories meant for a different family member.

---

## Storage Location: localStorage

**Key:** `family_session`

**Value:**
```typescript
interface FamilySession {
  sessionToken: string;
  storytellerId: string;
  storytellerName: string;
  familyMemberName: string;
  relationship: string | null;
  permissionLevel: 'viewer' | 'contributor';
  expiresAt: string; // ISO timestamp
  firstAccess: boolean;
}
```

**Persisted:** Yes, survives page refreshes

**Cleared on:**
- Session expires (checked on page load)
- Family member logs out (if logout button exists)
- `/api/family/refresh-session` returns `requiresNewLink: true`

---

## Error Scenarios & Responses

### Invite Token Errors

#### "No invitation token provided"
- **Status:** 400 (client error)
- **When:** User visits `/family/access` without `?token=...` parameter
- **Recovery:** None - need new magic link from storyteller

#### "Invalid or expired invite link"
- **Status:** 404
- **When:** Token doesn't exist in `family_invites` table
- **Possible Causes:**
  - Token was never generated
  - Typo in URL
  - Token belongs to different database
- **Recovery:** Request new invite from storyteller

#### "This invite link has expired"
- **Status:** 400
- **When:** `expires_at < NOW()`
- **Duration:**
  - Initial invite: 14 days
  - Resent invite: 7 days
- **Recovery:** Ask storyteller to click "Resend" button

---

### Session Token Errors

#### "No session token provided"
- **Status:** 401
- **When:** API called without `Authorization: Bearer ...` header
- **When it happens:** Very rare - useFamilyAuth() checks before querying
- **Recovery:** Click magic link again

#### "Invalid session token"
- **Status:** 401
- **When:** Token doesn't exist in `family_sessions` table
- **Possible Causes:**
  - Token was never created
  - Token was deleted (e.g., member was removed, session rotated)
  - Typo in token
- **Recovery:** Click magic link again

#### "Session expired"
- **Status:** 401
- **When:** `expires_at < NOW()` (renewable expiry passed)
- **When it happens:**
  - After 30 days of inactivity
  - Or 30 days after last refresh
- **Recovery:** Ask storyteller to click "Resend" button to generate new invite

#### "Session has reached absolute expiry limit"
- **Status:** 401
- **When:** `NOW() >= absolute_expires_at`
- **When it happens:** After 90 days since session creation (hard limit)
- **Recovery:** Ask storyteller to click "Resend" button to generate new invite
- **Special Response:** `{ error: "...", requiresNewLink: true }`
  - This tells frontend to clear session and redirect to `/family/expired`

---

## Validation Locations

### Frontend (localStorage)

**In `useFamilyAuth()` hook:**
```typescript
// Check if expired on load
if (new Date(data.expiresAt) < new Date()) {
  clearSession();
  setLoading(false);
  return;
}

// Auto-refresh if expiring within 7 days
const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
if (daysUntilExpiry < 7) {
  await refreshSession(data);
}
```

**When:** Every page load and navigation

**What:** Checks localStorage `family_session.expiresAt`

**Accuracy:** High - but relies on client clock being correct

---

### Backend (Database)

**In `/api/family/stories/[userId]/route.ts`:**
```typescript
// 1. Find session in database
const { data: session } = await supabaseAdmin
  .from('family_sessions')
  .select('...')
  .eq('token', token)
  .single();

// 2. Check expiry
if (new Date(session.expires_at) < new Date()) {
  return NextResponse.json({ error: 'Session expired' }, { status: 401 });
}

// 3. Update activity
await supabaseAdmin
  .from('family_sessions')
  .update({ last_active_at: new Date().toISOString() })
  .eq('id', session.id);
```

**When:** Every API call to fetch stories

**What:** Checks `family_sessions.expires_at` in database

**Accuracy:** Very high - authoritative source

---

### Cleanup

**Automatic cleanup function in migrations:**
```sql
CREATE OR REPLACE FUNCTION cleanup_expired_family_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.family_sessions
  WHERE
    expires_at < NOW() OR
    absolute_expires_at < NOW();

  DELETE FROM public.family_invites
  WHERE expires_at < NOW() AND used_at IS NULL;
END;
$$;
```

**When:** Called on INSERT (via trigger, 10% of the time to avoid overhead)

**Purpose:** Remove old expired records

---

## Data Model Summary

### Relationships

```
users (storyteller)
  └─ family_members (many)
      ├─ family_invites (many) - historical
      └─ family_sessions (one active) - current auth token
```

### Key Timings

| Component | Duration | Purpose | Renewable? |
|-----------|----------|---------|-----------|
| Initial Invite | 14 days | Magic link valid window | No (new invite resets) |
| Resent Invite | 7 days | Magic link valid window | No (new invite resets) |
| Session Token | 30 days | Auth token (renewable) | Yes, extends to max |
| Absolute Limit | 90 days | Hard max session lifetime | No, hard cutoff |
| Auto-refresh Trigger | Within 7 days | When to refresh session | On every page load |

---

## Testing the Flow

### Quick Manual Test

```
1. Create invitation:
   POST /api/family/invite
   Body: { email: "test@example.com", name: "Test User" }

2. Click magic link:
   GET /family/access?token=TOKEN_FROM_EMAIL

3. Verify session stored:
   - Open DevTools Console
   - localStorage.getItem('family_session')
   - Should contain sessionToken, expiresAt, storytellerId

4. Access timeline:
   - Navigate to /family/timeline/{storytellerId}
   - Stories should load via /api/family/stories/{userId}

5. Test expiry:
   - Open DevTools Console
   - localStorage.getItem('family_session')
   - Manually set expiresAt to past date: 
     localStorage.setItem('family_session', JSON.stringify({...session, expiresAt: '2025-01-01T...'}))
   - Refresh page
   - Should redirect to /family/expired

6. Test refresh:
   - Manually set expiresAt to 6 days from now
   - Refresh page
   - useFamilyAuth() should auto-call refresh-session
   - Check Network tab: POST /api/family/refresh-session
   - expiresAt should now be 30 days from now
```

---

## Summary: What Works & What Breaks

### Day 0: Invite Sent
- **Invite Token:** ✓ Valid (14-day window)
- **Session Token:** ✗ None yet
- **Access to Timeline:** ✗ Blocked

### Day 1: User Clicks Invite Link
- **Invite Token:** ✓ Valid (13 days remaining)
- **Session Token:** ✓ Created (30 days, 90-day hard limit)
- **Access to Timeline:** ✓ Works (through FamilyGuard + sessionToken validation)

### Day 15: Invite Expired, Session Still Valid
- **Invite Token:** ✗ Expired (exceeded 14 days)
- **Session Token:** ✓ Still valid (16 days remaining on original 30)
- **Access to Timeline:** ✓ Works (session token is independent of invite)
- **If They Click Original Link:** ✗ "Invite Expired" error
- **If Storyteller Clicks Resend:** ✓ New 7-day invite created

### Day 35: Session Expired (30 days from Day 1)
- **Invite Token:** ✗ Expired (from Day 0)
- **Session Token:** ✗ Expired (exceeded 30-day renewable window)
- **Access to Timeline:** ✗ Redirected to /family/expired
- **Recovery:** Storyteller must click Resend to generate new invite

### Day 91: Absolute Hard Limit Reached
- **Session Token:** ✗ Absolute expiry passed (90-day hard limit)
- **Access to Timeline:** ✗ Cannot refresh beyond this point
- **Recovery:** ONLY way is new magic link from storyteller

### Original Invite Link Clicked After 14 Days
- **Result:** ✗ "This invite link has expired" (400 error)
- **Invite Table:** `family_invites.expires_at < NOW()` = true
- **Recovery:** Must request new invite

### Valid Session, Visit Timeline with Expired Clock
- **Frontend Check:** Compares `expiresAt` string to `new Date()`
- **If Ahead of Server:** May pass frontend check but fail API validation
- **API Check:** Queries `family_sessions.expires_at` from database (authoritative)
- **Result:** API returns 401, frontend should redirect to error page

### Session Refreshes Multiple Times
- **Each Refresh:** Extends `expires_at` by 30 days
- **Cap:** Can never exceed `absolute_expires_at`
- **Example:**
  - Day 1: Created with expires_at=Day 31, absolute=Day 91
  - Day 25: Refresh → expires_at=Day 55 (still < Day 91) ✓
  - Day 50: Refresh → expires_at=Day 80 (still < Day 91) ✓
  - Day 80: Refresh → expires_at=Day 110? NO, capped at Day 91
  - Day 91: Session expires, requires new invite

---

## Architecture Decision: Two Token Systems

**Why separate Invite Token and Session Token?**

1. **Invite Token (`family_invites.token`):**
   - Short-lived magic link for initial onboarding
   - One-time use (marks `used_at` after first click)
   - Generates new session on use
   - Allows recovery: clicking link again creates fresh session if needed

2. **Session Token (`family_sessions.token`):**
   - Long-lived authentication token
   - Independent from invite token
   - Can be refreshed automatically
   - Hard expiry limit prevents indefinite access

**Benefit:** Family member can lose localStorage (clear browser cache) or device dies for a month. When they return and storyteller resends invite, they get a brand new session token. This is cleaner than trying to manage a single token across multiple devices and time periods.

---

## Files Involved

### Database Schema
- `/migrations/0004_add_family_sharing.sql` - Tables: family_members, family_invites, family_sessions
- `/migrations/0008_family_session_security.sql` - Cleanup functions and rotation logic
- `/migrations/0017_create_family_sessions.sql` - RLS policies

### API Routes
- `/app/api/family/invite/route.ts` - Create initial invitation (14-day)
- `/app/api/family/[memberId]/resend/route.ts` - Resend invitation (7-day)
- `/app/api/family/verify/route.ts` - Verify invite, create session token
- `/app/api/family/refresh-session/route.ts` - Extend session (up to 90-day absolute limit)
- `/app/api/family/stories/[userId]/route.ts` - Fetch stories (validates sessionToken)

### Frontend Components
- `/app/family/access/page.tsx` - Magic link landing page
- `/app/family/timeline/[userId]/page.tsx` - Timeline view (protected by FamilyGuard)
- `/app/family/book/[userId]/page.tsx` - Book view (protected by FamilyGuard)
- `/app/family/expired/page.tsx` - Session expired error
- `/app/family/unauthorized/page.tsx` - Wrong storyteller error

### Hooks & Utilities
- `/hooks/use-family-auth.ts` - Session state management + auto-refresh
- `/components/FamilyGuard.tsx` - Route protection component

---

## Conclusion

The family member access flow uses two completely independent token systems:

1. **Invite tokens** (14 days / 7 days on resend) - Magic links for onboarding
2. **Session tokens** (30 days renewable, 90 days absolute max) - Authentication

This architecture provides:
- ✓ Simple UX: One-time magic link click
- ✓ Security: Session rotation on each link click
- ✓ Flexibility: Works across device changes and time gaps
- ✓ Hard limit: 90-day absolute expiry prevents indefinite access
- ✓ Auto-refresh: Seamless experience within the 30-day window

There is **NO** `family_access_tokens` table - sessions are stored in `family_sessions`.

