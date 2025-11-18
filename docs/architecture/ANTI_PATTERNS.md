# Anti-Patterns & Best Practices

> **Version:** 1.0  
> **Last Updated:** October 31, 2025  
> **Purpose:** Common mistakes to avoid when working with HeritageWhisper database  
> **Related Documentation:** [DATA_MODEL.md](DATA_MODEL.md) | [SCHEMA_REFERENCE.md](SCHEMA_REFERENCE.md) | [RPC_FUNCTIONS.md](RPC_FUNCTIONS.md)

## Table of Contents

1. [Field Naming Gotchas](#field-naming-gotchas)
2. [RLS Bypass Risks](#rls-bypass-risks)
3. [Service Key Misuse](#service-key-misuse)
4. [Query Optimization](#query-optimization)
5. [Data Validation Patterns](#data-validation-patterns)
6. [Common TypeScript Mistakes](#common-typescript-mistakes)
7. [Transaction Patterns](#transaction-patterns)
8. [Migration Best Practices](#migration-best-practices)

---

## Field Naming Gotchas

### ❌ Don't: Mix snake_case and camelCase in queries

```typescript
// WRONG - camelCase won't work with Supabase client
const { data } = await supabase
  .from('stories')
  .select('*')
  .eq('userId', userId);  // ❌ Field doesn't exist

// WRONG - Using TypeScript types with Supabase queries
const { data } = await supabase
  .from('stories')
  .select('*')
  .eq(stories.userId, userId);  // ❌ Drizzle syntax in Supabase client
```

### ✅ Do: Always use snake_case with Supabase client

```typescript
// CORRECT - Database field names (snake_case)
const { data } = await supabase
  .from('stories')
  .select('*')
  .eq('user_id', userId);  // ✅ Correct field name

// Then map to TypeScript types
const mappedStories = data?.map(story => ({
  userId: story.user_id,
  storyYear: story.story_year,
  audioUrl: story.audio_url
}));
```

### ❌ Don't: Use camelCase in migrations

```sql
-- WRONG
ALTER TABLE stories ADD COLUMN storyYear INTEGER;
CREATE INDEX idx_stories_userId ON stories(userId);
```

### ✅ Do: Always use snake_case in SQL

```sql
-- CORRECT
ALTER TABLE stories ADD COLUMN story_year INTEGER;
CREATE INDEX idx_stories_user_id ON stories(user_id);
```

---

## RLS Bypass Risks

### ❌ Don't: Use service role client for regular user operations

```typescript
// WRONG - Bypasses RLS, security risk
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  const { data } = await supabaseAdmin
    .from('stories')
    .select('*');  // ❌ Returns ALL stories from ALL users!
  
  return NextResponse.json({ stories: data });
}
```

### ✅ Do: Use regular client with RLS

```typescript
// CORRECT - Respects RLS policies
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  
  // RLS automatically filters to current user's stories
  const { data } = await supabase
    .from('stories')
    .select('*');
  
  return NextResponse.json({ stories: data });
}
```

### ❌ Don't: Fetch all data then filter client-side

```typescript
// WRONG - Fetches all users' data, then filters (security risk!)
const { data: allStories } = await supabaseAdmin
  .from('stories')
  .select('*');

const userStories = allStories?.filter(s => s.user_id === userId);  // ❌ Leaked data!
```

### ✅ Do: Filter server-side with RLS or explicit filters

```typescript
// CORRECT - Filter at database level
const { data } = await supabase
  .from('stories')
  .select('*')
  .eq('user_id', userId);  // ✅ Database filters first
```

---

## Service Key Misuse

### ❌ Don't: Import service key in client components

```typescript
// WRONG - In a client component
'use client';

import { supabaseAdmin } from '@/lib/supabaseAdmin';  // ❌ NEVER in client!

export function StoryList() {
  const [stories, setStories] = useState([]);
  
  useEffect(() => {
    supabaseAdmin.from('stories').select('*')...  // ❌ Service key exposed!
  }, []);
}
```

### ✅ Do: Use service key only in server-side code

```typescript
// CORRECT - In API route
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  // Admin operation that requires bypassing RLS
  const { data } = await supabaseAdmin
    .from('admin_audit_log')
    .insert({...});  // ✅ Server-side only
  
  return NextResponse.json({ success: true });
}
```

### ⚠️ Warning: Audit Service Key Usage

HeritageWhisper currently has 107 files using `SUPABASE_SERVICE_ROLE_KEY`. Review each usage:

1. **Legitimate uses:**
   - Admin operations
   - Background jobs
   - User management (creating accounts, etc.)

2. **Questionable uses:**
   - Regular user data access (should use RLS)
   - File uploads (can use user token)
   - Story creation (should use user auth)

---

## Query Optimization

### ❌ Don't: Use SELECT * without filtering

```typescript
// WRONG - Fetches all stories, very slow
const { data } = await supabase
  .from('stories')
  .select('*');  // ❌ No filtering, no pagination
```

### ✅ Do: Always filter and paginate

```typescript
// CORRECT - Filtered and paginated
const { data } = await supabase
  .from('stories')
  .select('id, title, story_year, created_at')  // ✅ Only needed fields
  .eq('user_id', userId)  // ✅ Filter
  .order('created_at', { ascending: false })  // ✅ Sort
  .range(0, 19);  // ✅ Paginate (20 items)
```

### ❌ Don't: Query in loops (N+1 problem)

```typescript
// WRONG - Makes N database queries
const storyIds = ['id1', 'id2', 'id3', ...];  // 100 IDs

for (const id of storyIds) {
  const { data } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single();  // ❌ 100 separate queries!
  
  processStory(data);
}
```

### ✅ Do: Batch queries with IN clause

```typescript
// CORRECT - Single query
const storyIds = ['id1', 'id2', 'id3', ...];

const { data: stories } = await supabase
  .from('stories')
  .select('*')
  .in('id', storyIds);  // ✅ One query for all stories

stories?.forEach(story => processStory(story));
```

### ❌ Don't: Ignore indexes

```typescript
// WRONG - Query on un-indexed field
const { data } = await supabase
  .from('stories')
  .select('*')
  .eq('lesson_learned', 'Be kind');  // ❌ No index on lesson_learned, slow!
```

### ✅ Do: Query on indexed fields

```typescript
// CORRECT - Query on indexed fields
const { data } = await supabase
  .from('stories')
  .select('*')
  .eq('user_id', userId)  // ✅ Has index: idx_stories_user_id
  .order('created_at', { ascending: false });  // ✅ Has index: idx_stories_created_at
```

---

## Data Validation Patterns

### ❌ Don't: Trust client-side validation only

```typescript
// WRONG - Client can bypass this
function createStory(title: string, audio: File) {
  if (audio.size > 25 * 1024 * 1024) {
    return;  // ❌ Client can modify this check
  }
  
  // Upload proceeds...
}
```

### ✅ Do: Validate server-side

```typescript
// CORRECT - Server-side validation
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const audio = formData.get('audio') as File;
  
  // Server-side validation (cannot be bypassed)
  if (audio.size > 25 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'File too large' },
      { status: 400 }
    );
  }
  
  // Also validate with Zod schema
  const validated = FileUploadSchema.parse({
    filename: audio.name,
    mimeType: audio.type,
    size: audio.size
  });
  
  // Proceed with upload...
}
```

### ❌ Don't: Rely only on database constraints

```typescript
// WRONG - No validation before insert
const { data } = await supabase
  .from('stories')
  .insert({
    duration_seconds: 500  // ❌ DB constraint will fail (max 120)
  });
// User sees generic database error
```

### ✅ Do: Validate before database operations

```typescript
// CORRECT - Validate first, then insert
if (durationSeconds < 1 || durationSeconds > 120) {
  return NextResponse.json(
    { error: 'Duration must be between 1 and 120 seconds' },
    { status: 400 }
  );
}

const { data } = await supabase
  .from('stories')
  .insert({ duration_seconds: durationSeconds });  // ✅ Will succeed
```

---

## Common TypeScript Mistakes

### ❌ Don't: Assume data exists without checking

```typescript
// WRONG - data might be null
const { data } = await supabase
  .from('stories')
  .select('*')
  .eq('id', storyId)
  .single();

const title = data.title;  // ❌ Runtime error if data is null!
```

### ✅ Do: Check for null/undefined

```typescript
// CORRECT - Type-safe null checking
const { data, error } = await supabase
  .from('stories')
  .select('*')
  .eq('id', storyId)
  .single();

if (error || !data) {
  return NextResponse.json(
    { error: 'Story not found' },
    { status: 404 }
  );
}

const title = data.title;  // ✅ Safe, data is guaranteed to exist
```

### ❌ Don't: Ignore TypeScript errors in database operations

```typescript
// WRONG - Ignoring type errors
const { data } = await supabase
  .from('stories')
  .insert({
    user_id: userId,
    title: title,
    invalidField: 'value'  // ❌ TypeScript error ignored
  } as any);  // ❌ Never use 'as any'!
```

### ✅ Do: Use proper TypeScript types

```typescript
// CORRECT - Type-safe insert
import type { Database } from '@/lib/database.types';

type Story = Database['public']['Tables']['stories']['Insert'];

const newStory: Story = {
  user_id: userId,
  title: title,
  // TypeScript prevents invalid fields ✅
};

const { data } = await supabase
  .from('stories')
  .insert(newStory);
```

---

## Transaction Patterns

### ❌ Don't: Use multiple separate queries for related operations

```typescript
// WRONG - Not atomic, can fail partially
await supabase.from('users').update({ story_count: sql`story_count + 1` }).eq('id', userId);
await supabase.from('stories').insert({ user_id: userId, title: 'New Story' });
await supabase.from('ai_usage_log').insert({ user_id: userId, operation: 'create_story' });
// If 3rd query fails, first 2 succeeded - inconsistent state! ❌
```

### ✅ Do: Use RPC functions for atomic operations

```typescript
// CORRECT - Use RPC for atomic multi-table operations
const { data, error } = await supabase.rpc('create_story_atomic', {
  p_user_id: userId,
  p_title: 'New Story',
  p_operation: 'create_story'
});

// All operations succeed or all fail together ✅
```

### ✅ Alternative: Handle failures with compensation

```typescript
// CORRECT - Rollback pattern
const { data: user, error: userError } = await supabase
  .from('users')
  .update({ story_count: sql`story_count + 1` })
  .eq('id', userId)
  .select()
  .single();

if (userError) {
  return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
}

const { data: story, error: storyError } = await supabase
  .from('stories')
  .insert({ user_id: userId, title: 'New Story' })
  .select()
  .single();

if (storyError) {
  // Rollback user update
  await supabase
    .from('users')
    .update({ story_count: sql`story_count - 1` })
    .eq('id', userId);
  
  return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
}
```

---

## Migration Best Practices

### ❌ Don't: Make destructive changes without backups

```sql
-- WRONG - No backup, no rollback plan
ALTER TABLE stories DROP COLUMN old_field;
-- If this was needed, data is lost forever! ❌
```

### ✅ Do: Rename first, deprecate later

```sql
-- CORRECT - Gradual migration
-- Step 1: Add new column
ALTER TABLE stories ADD COLUMN new_field TEXT;

-- Step 2: Copy data
UPDATE stories SET new_field = old_field WHERE old_field IS NOT NULL;

-- Step 3: Update application code to use new_field

-- Step 4: After verifying, deprecate old column
-- (Keep it for rollback period)

-- Step 5: Much later, after confirming no issues
-- ALTER TABLE stories DROP COLUMN old_field;
```

### ❌ Don't: Add NOT NULL without defaults

```sql
-- WRONG - Will fail if table has rows
ALTER TABLE stories ADD COLUMN required_field TEXT NOT NULL;
-- ❌ Error: column "required_field" contains null values
```

### ✅ Do: Add column with default, then remove default

```sql
-- CORRECT - Two-step migration
-- Step 1: Add column with default
ALTER TABLE stories ADD COLUMN required_field TEXT NOT NULL DEFAULT 'default_value';

-- Step 2: Update existing rows
UPDATE stories SET required_field = 'actual_value' WHERE required_field = 'default_value';

-- Step 3: Remove default (optional)
ALTER TABLE stories ALTER COLUMN required_field DROP DEFAULT;
```

### ❌ Don't: Forget to update RLS policies

```sql
-- WRONG - Added column but forgot RLS
ALTER TABLE stories ADD COLUMN sensitive_data TEXT;
-- ❌ RLS policy doesn't cover new column, might expose data!
```

### ✅ Do: Update RLS policies when adding sensitive fields

```sql
-- CORRECT - Update RLS with new field
ALTER TABLE stories ADD COLUMN sensitive_data TEXT;

-- Update policy to explicitly list columns
DROP POLICY IF EXISTS stories_select_policy ON stories;

CREATE POLICY stories_select_policy ON stories
  FOR SELECT
  USING (auth.uid() = user_id);
-- Now includes new column ✅
```

---

## Quick Reference Checklist

**Before Writing a Query:**
- [ ] Using snake_case for field names?
- [ ] Filtering on indexed columns?
- [ ] Using RLS instead of service role?
- [ ] Paginating results?
- [ ] Validating input server-side?

**Before Creating a Migration:**
- [ ] Tested on development database first?
- [ ] Have rollback plan?
- [ ] Updated RLS policies if needed?
- [ ] Using NOT NULL? Added default first?
- [ ] Dropping columns? Kept backup?

**Before Using Service Role Key:**
- [ ] Is this truly an admin operation?
- [ ] Can RLS policies handle this instead?
- [ ] Is this in server-side code only?
- [ ] Documented why service role is needed?

---

**Related Documentation:**
- [DATA_MODEL.md](DATA_MODEL.md) - Overview and quick reference
- [SCHEMA_REFERENCE.md](SCHEMA_REFERENCE.md) - Detailed table documentation
- [RPC_FUNCTIONS.md](RPC_FUNCTIONS.md) - Database functions
- [DATA_FLOW_PATTERNS.md](DATA_FLOW_PATTERNS.md) - Operation workflows

---

_Last updated: October 31, 2025 - Based on common issues found in HeritageWhisper codebase_

