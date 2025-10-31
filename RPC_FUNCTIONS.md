# RPC Functions Reference

> **Version:** 4.0  
> **Last Updated:** October 31, 2025  
> **Database:** PostgreSQL 17+ via Supabase  
> **Related Documentation:** [DATA_MODEL.md](DATA_MODEL.md) | [SCHEMA_REFERENCE.md](SCHEMA_REFERENCE.md) | [ANTI_PATTERNS.md](ANTI_PATTERNS.md)

## Table of Contents

1. [Prompt System Functions](#prompt-system-functions)
2. [AI Budget Control Functions](#ai-budget-control-functions)
3. [Family Sharing Functions](#family-sharing-functions)
4. [Multi-Tenant Access Control](#multi-tenant-access-control)
5. [Export Tracking Functions](#export-tracking-functions)
6. [Queue Management Functions](#queue-management-functions)
7. [Additional Functions](#additional-functions)
8. [Triggers](#triggers)
9. [Views](#views)

---

## Prompt System Functions

### archive_expired_prompts()

**Purpose:** Moves expired prompts from `active_prompts` to `prompt_history`

**Signature:**
```sql
archive_expired_prompts() → VOID
```

**Behavior:**
- Archives prompts where `expires_at < NOW()`
- Copies to `prompt_history` with `outcome = 'expired'`
- Deletes from `active_prompts`
- Cleans up history older than 365 days

**Usage:**
```typescript
const { data, error } = await supabase.rpc('archive_expired_prompts');
```

**Scheduled:** Run via cron job (daily)

**Performance:** Affects ~100-500 rows per day

---

## AI Budget Control Functions

### check_ai_budget()

**Purpose:** Validates if user is within daily/monthly AI budget before expensive operations

**Signature:**
```sql
check_ai_budget(
  p_user_id UUID,
  p_operation TEXT,
  p_estimated_cost DECIMAL
) → BOOLEAN
```

**Parameters:**
- `p_user_id`: User to check budget for
- `p_operation`: Operation type (e.g., 'transcription', 'enhancement')
- `p_estimated_cost`: Estimated cost in USD

**Returns:** `true` if within budget, `false` if exceeded

**Logic:**
1. Fetches user's `ai_daily_budget_usd` and `ai_monthly_budget_usd`
2. Calculates spending from `ai_usage_log` (today and this month)
3. Returns false if `current_spent + estimated_cost > budget`

**Usage:**
```typescript
const { data: canProceed } = await supabase.rpc('check_ai_budget', {
  p_user_id: userId,
  p_operation: 'tier3_prompt_generation',
  p_estimated_cost: 0.50
});

if (!canProceed) {
  throw new Error('AI budget exceeded');
}
```

**Used By:** Tier 3 prompt generation, story enhancement APIs

---

### log_ai_usage()

**Purpose:** Logs AI API usage to `ai_usage_log` table

**Signature:**
```sql
log_ai_usage(
  p_user_id UUID,
  p_operation TEXT,
  p_model TEXT,
  p_tokens_used INTEGER,
  p_cost_usd DECIMAL,
  p_ip_address TEXT
) → VOID
```

**Parameters:**
- `p_user_id`: User who triggered operation
- `p_operation`: Operation type
- `p_model`: AI model used (e.g., 'gpt-4o', 'whisper-1')
- `p_tokens_used`: Token count
- `p_cost_usd`: Cost in USD
- `p_ip_address`: Request IP (hashed)

**Usage:**
```typescript
await supabase.rpc('log_ai_usage', {
  p_user_id: userId,
  p_operation: 'transcription',
  p_model: 'whisper-1',
  p_tokens_used: 1500,
  p_cost_usd: 0.15,
  p_ip_address: hashedIp
});
```

**Called After:** Every AI operation (transcription, enhancement, prompt generation)

---

## Family Sharing Functions

### cleanup_expired_family_access()

**Purpose:** Deletes expired unused invites

**Signature:**
```sql
cleanup_expired_family_access() → VOID
```

**Behavior:**
- Deletes from `family_invites` where `expires_at < NOW()` AND `used_at IS NULL`
- Also deletes expired sessions from `family_sessions` (legacy - table no longer exists)

**Usage:**
```typescript
const { error } = await supabase.rpc('cleanup_expired_family_access');
```

**Scheduled:** Run via cron job (daily)

**⚠️ Warning:** Partially broken - references deleted `family_sessions` table

---

### cleanup_expired_family_sessions()

**Purpose:** Removes all expired family sessions

**Signature:**
```sql
cleanup_expired_family_sessions() → VOID
```

**Status:** ⚠️ **Legacy function** - References deleted `family_sessions` table

**Current State:** Not functional (table no longer exists)

**Action Needed:** Remove function or update to work with current schema

---

### rotate_family_session_token()

**Purpose:** Rotates session token for security

**Signature:**
```sql
rotate_family_session_token(p_session_id UUID) → TEXT
```

**Status:** ⚠️ **Legacy function** - References deleted `family_sessions` table

**Current State:** Not functional (table no longer exists)

**Action Needed:** Remove function or redesign for current architecture

---

## Multi-Tenant Access Control

### has_collaboration_access()

**Purpose:** Critical security function for multi-tenant access control

**Signature:**
```sql
has_collaboration_access(
  p_user_id UUID,
  p_storyteller_id UUID
) → BOOLEAN
```

**Parameters:**
- `p_user_id`: User requesting access
- `p_storyteller_id`: Storyteller account being accessed

**Returns:** `true` if access allowed, `false` otherwise

**Logic:**
Returns `true` if:
1. User is accessing own data (`p_user_id = p_storyteller_id`), OR
2. User has active family collaboration:
   - Exists in `family_collaborations` table
   - `status = 'active'`
   - Links to valid `family_members` record

**Usage:**
```typescript
const { data: hasAccess } = await supabase.rpc('has_collaboration_access', {
  p_user_id: currentUser.id,
  p_storyteller_id: targetUserId
});

if (!hasAccess) {
  throw new Error('Access denied');
}
```

**Used By:** Family sharing features, multi-tenant story access

**Critical:** This function enforces multi-tenant security boundaries

---

## Export Tracking Functions

### increment_pdf_export()

**Purpose:** Increments PDF export counter for user

**Signature:**
```sql
increment_pdf_export(user_uuid UUID) → VOID
```

**Status:** ⚠️ **Partially broken** - References old column names

**Issue:**
- Attempts to update `users.pdf_exports` (actual column: `pdf_exports_count`)
- Attempts to update `users.last_pdf_export` (actual column: `last_pdf_export_at`)

**Workaround:** Update columns directly in application code

**Usage (broken):**
```typescript
// This may fail due to column name mismatch
await supabase.rpc('increment_pdf_export', { user_uuid: userId });
```

**Recommended Fix:**
```typescript
// Direct update instead of RPC
await supabase
  .from('users')
  .update({
    pdf_exports_count: sql`pdf_exports_count + 1`,
    last_pdf_export_at: new Date().toISOString()
  })
  .eq('id', userId);
```

---

### increment_data_export()

**Purpose:** Increments data export counter for user

**Signature:**
```sql
increment_data_export(user_uuid UUID) → VOID
```

**Status:** ⚠️ **Partially broken** - References old column names

**Issue:** Same as `increment_pdf_export()`

**Recommended Fix:** Use direct UPDATE instead of RPC

---

## Queue Management Functions

### get_next_queue_position()

**Purpose:** Returns next available queue position for user

**Signature:**
```sql
get_next_queue_position(p_user_id UUID) → INTEGER
```

**Status:** ⚠️ **Partially broken** - References non-existent table

**Issue:** References `user_prompts_catalog` table (actual table: `user_prompts`)

**Logic:**
- Checks both `active_prompts` and `user_prompts` tables
- Returns `MAX(queue_position) + 1`

**Usage:**
```typescript
const { data: nextPosition } = await supabase.rpc('get_next_queue_position', {
  p_user_id: userId
});
```

**Recommended:** Update function to reference correct table name

---

## Additional Functions

### get_user_collaborations()

**Purpose:** Returns all storyteller accounts this user can access

**Signature:**
```sql
get_user_collaborations(p_user_id UUID) → TABLE(
  storyteller_user_id UUID,
  storyteller_name TEXT,
  storyteller_email TEXT,
  permission_level TEXT,
  relationship TEXT,
  status TEXT
)
```

**Returns:** Table of accessible storyteller accounts

**Logic:**
- Joins `family_collaborations`, `family_members`, and `users`
- Filters for `status = 'active'`
- Returns storyteller details with permission info

**Usage:**
```typescript
const { data: collaborations } = await supabase.rpc('get_user_collaborations', {
  p_user_id: userId
});

// Returns:
// [
//   {
//     storyteller_user_id: 'uuid',
//     storyteller_name: 'John Doe',
//     storyteller_email: 'john@example.com',
//     permission_level: 'viewer',
//     relationship: 'child',
//     status: 'active'
//   }
// ]
```

**Used By:** Family dashboard, account switcher

---

### increment_view_count()

**Purpose:** Increments view count for shared story

**Signature:**
```sql
increment_view_count(share_code_param TEXT) → VOID
```

**Logic:**
1. Updates `shares.view_count += 1`
2. Updates `shares.last_viewed_at = NOW()`
3. Updates `stories.play_count += 1` (if column exists)

**Usage:**
```typescript
await supabase.rpc('increment_view_count', {
  share_code_param: shareCode
});
```

**Used By:** Public story sharing feature

---

## Triggers

### update_updated_at_column()

**Purpose:** Auto-updates `updated_at` timestamp on row modification

**Signature:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Applied To:**
- `users`
- `prompt_feedback`
- `stories` (if exists)

**Usage:** Automatic - no manual invocation needed

---

### trigger_cleanup_expired_sessions()

**Purpose:** 10% probability cleanup on INSERT

**Status:** ⚠️ **Legacy trigger** - References deleted `family_sessions` table

**Current State:** Not functional

**Action Needed:** Remove trigger or update for current schema

---

### update_prompt_feedback_updated_at()

**Purpose:** Specific auto-update trigger for `prompt_feedback` table

**Applied To:** `prompt_feedback`

**Usage:** Automatic on UPDATE

---

### update_family_prompts_updated_at()

**Purpose:** Specific auto-update trigger for `family_prompts` table

**Applied To:** `family_prompts`

**Usage:** Automatic on UPDATE

---

## Views

### prompt_quality_stats

**Purpose:** Aggregated statistics for prompt feedback dashboard

**Type:** VIEW

**Status:** ✅ **Production view** - Only view in production database

**Definition:**
```sql
CREATE VIEW prompt_quality_stats AS
SELECT
  rating,
  prompt_tier,
  prompt_type,
  COUNT(*) as count,
  AVG(prompt_score) as avg_score,
  AVG(word_count) as avg_word_count,
  ARRAY_AGG(DISTINCT tags) as common_tags
FROM prompt_feedback
GROUP BY rating, prompt_tier, prompt_type;
```

**Columns:**
- `rating` - Feedback rating
- `prompt_tier` - Tier level (0-3)
- `prompt_type` - Type category
- `count` - Number of feedbacks
- `avg_score` - Average quality score
- `avg_word_count` - Average story length
- `common_tags` - Aggregated tags

**Usage:**
```typescript
const { data: stats } = await supabase
  .from('prompt_quality_stats')
  .select('*')
  .eq('rating', 'excellent');
```

**Used By:** Admin dashboard for prompt system health monitoring

---

## Function Status Summary

| Function | Status | Action Needed |
|----------|--------|---------------|
| `archive_expired_prompts()` | ✅ Working | None |
| `check_ai_budget()` | ✅ Working | None |
| `log_ai_usage()` | ✅ Working | None |
| `cleanup_expired_family_access()` | ⚠️ Partially broken | Remove reference to family_sessions |
| `cleanup_expired_family_sessions()` | ❌ Non-functional | Remove or redesign |
| `rotate_family_session_token()` | ❌ Non-functional | Remove or redesign |
| `has_collaboration_access()` | ✅ Working | None |
| `increment_pdf_export()` | ⚠️ Partially broken | Fix column names |
| `increment_data_export()` | ⚠️ Partially broken | Fix column names |
| `get_next_queue_position()` | ⚠️ Partially broken | Fix table reference |
| `get_user_collaborations()` | ✅ Working | None |
| `increment_view_count()` | ✅ Working | None |

**Legend:**
- ✅ Working - Function operates correctly
- ⚠️ Partially broken - Function has issues but may work in some cases
- ❌ Non-functional - Function will fail (references deleted tables)

---

## Best Practices

### When to Use RPC Functions

**Use RPC when:**
- Complex business logic spanning multiple tables
- Atomic operations requiring transactions
- Budget/quota enforcement
- Security-critical access checks

**Don't use RPC when:**
- Simple SELECT/INSERT/UPDATE operations
- RLS policies can handle access control
- Client-side logic is sufficient

### Error Handling

```typescript
const { data, error } = await supabase.rpc('check_ai_budget', {
  p_user_id: userId,
  p_operation: 'transcription',
  p_estimated_cost: 0.25
});

if (error) {
  console.error('RPC call failed:', error);
  throw new Error('Budget check failed');
}

if (!data) {
  throw new Error('AI budget exceeded');
}
```

### Performance Considerations

- RPC functions run server-side (no network overhead for multi-table operations)
- Use indexes on columns referenced in function WHERE clauses
- Avoid calling RPCs in loops - batch operations when possible
- Monitor function execution time in Supabase Dashboard

---

**Related Documentation:**
- [DATA_MODEL.md](DATA_MODEL.md) - Overview and quick reference
- [SCHEMA_REFERENCE.md](SCHEMA_REFERENCE.md) - Detailed table documentation
- [ANTI_PATTERNS.md](ANTI_PATTERNS.md) - Common mistakes to avoid
- [DATA_FLOW_PATTERNS.md](DATA_FLOW_PATTERNS.md) - Operation workflows

---

_Last verified: October 31, 2025 - Function status checked against Supabase database_

