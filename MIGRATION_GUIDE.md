# Database Migration Guide - Phase 2 Security Enhancements
**Created:** 2025-10-15
**Status:** Ready to Execute

## Overview

Three database migrations are ready to implement critical security improvements. These must be run **in order** in your Supabase SQL Editor.

---

## ⚠️ Pre-Migration Checklist

Before running these migrations:

- [ ] **Backup your database** (Supabase Dashboard → Database → Backups)
- [ ] **Update admin email list** in migration 0006 (line 20-24)
- [ ] **Run during low-traffic period** (RLS policies may briefly impact performance)
- [ ] **Have rollback plan ready** (see Rollback section below)
- [ ] **Test in staging first** if you have a staging environment

---

## 📋 Migration Order

### Migration 0006: Add User Roles
**File:** `migrations/0006_add_user_roles.sql`
**Purpose:** Add RBAC (Role-Based Access Control) for admin authorization
**Duration:** ~30 seconds
**Impact:** Zero downtime, backward compatible

**What it does:**
- Adds `role` column to users table (user/admin/moderator)
- Creates `admin_audit_log` table for tracking admin actions
- Sets default role for all existing users
- Creates index for efficient role lookups

**⚠️ IMPORTANT: Update Admin Emails First**

Before running, edit lines 20-24 to add your admin email addresses:

```sql
UPDATE public.users
SET role = 'admin'
WHERE email IN (
  'your-email@heritagewhisper.com',  -- Change this
  'another-admin@heritagewhisper.com' -- Add more as needed
);
```

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy/paste entire contents of `migrations/0006_add_user_roles.sql`
4. **Update admin email list** (lines 20-24)
5. Click "Run"
6. Verify success with the query at the bottom (should show your admin users)

**Verification:**
```sql
-- Should return your admin users
SELECT email, role, created_at
FROM public.users
WHERE role = 'admin'
ORDER BY created_at;
```

---

### Migration 0007: Enable Row Level Security
**File:** `migrations/0007_enable_row_level_security.sql`
**Purpose:** Add database-level access control (defense in depth)
**Duration:** ~1-2 minutes
**Impact:** Minimal (uses service role key in API routes)

**What it does:**
- Enables RLS on: `stories`, `users`, `active_prompts`, `prompt_history`, `family_members`, `family_sessions`, `admin_audit_log`
- Creates policies: users can only access their own data
- Service role (API routes) retains full access
- Prevents direct database query bypass

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy/paste entire contents of `migrations/0007_enable_row_level_security.sql`
4. Click "Run"
5. Verify with the query at the bottom

**Verification:**
```sql
-- Should show rowsecurity = t (true) for all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('stories', 'users', 'active_prompts', 'prompt_history', 'family_members', 'family_sessions', 'admin_audit_log')
ORDER BY tablename;
```

**Expected Output:**
```
tablename             | rowsecurity
----------------------+-------------
active_prompts        | t
admin_audit_log       | t
family_members        | t
family_sessions       | t
prompt_history        | t
stories               | t
users                 | t
```

---

### Migration 0008: Family Session Security
**File:** `migrations/0008_family_session_security.sql`
**Purpose:** Auto-expire sessions, token rotation, max lifetime enforcement
**Duration:** ~45 seconds
**Impact:** Existing family sessions get 30-day absolute expiry

**What it does:**
- Adds `absolute_expires_at` column (max 30-day session lifetime)
- Creates `cleanup_expired_family_sessions()` function
- Creates `rotate_family_session_token()` function for token refresh
- Sets up auto-cleanup trigger (runs on 10% of inserts)
- Creates indexes for efficient expiry queries

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy/paste entire contents of `migrations/0008_family_session_security.sql`
4. Click "Run"
5. Function runs initial cleanup at end

**Verification:**
```sql
-- Check new column exists
SELECT
  id,
  expires_at,
  absolute_expires_at,
  created_at
FROM public.family_sessions
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🧪 Testing After Migration

### Test 1: Admin Authorization
```bash
# Should fail with 403 if user is not admin
curl -H "Authorization: Bearer <non-admin-token>" \
  https://dev.heritagewhisper.com/api/admin/test-accounts

# Should succeed if user is admin
curl -H "Authorization: Bearer <admin-token>" \
  https://dev.heritagewhisper.com/api/admin/test-accounts
```

### Test 2: RLS Enforcement
```sql
-- Try to query another user's stories (should return empty)
-- Run this as a non-admin user via Supabase client
SELECT * FROM stories WHERE user_id != '<your-user-id>';
-- Expected: 0 rows (RLS blocks access)
```

### Test 3: Family Session Expiry
```sql
-- Check session cleanup function works
SELECT cleanup_expired_family_sessions();
-- Should return "NOTICE: Cleaned up expired family sessions"
```

---

## 🔄 Rollback Plan

If something goes wrong, run these commands **in reverse order**:

### Rollback Migration 0008
```sql
-- Drop triggers and functions
DROP TRIGGER IF EXISTS cleanup_sessions_on_insert ON public.family_sessions;
DROP FUNCTION IF EXISTS trigger_cleanup_expired_sessions();
DROP FUNCTION IF EXISTS rotate_family_session_token(UUID);
DROP FUNCTION IF EXISTS cleanup_expired_family_sessions();

-- Drop indexes
DROP INDEX IF EXISTS idx_family_sessions_expires_at;
DROP INDEX IF EXISTS idx_family_sessions_absolute_expires_at;

-- Remove column
ALTER TABLE public.family_sessions DROP COLUMN IF EXISTS absolute_expires_at;
```

### Rollback Migration 0007
```sql
-- Disable RLS on all tables
ALTER TABLE public.stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_prompts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log DISABLE ROW LEVEL SECURITY;

-- Drop all policies (list policies first to get names)
-- Run: SELECT policyname FROM pg_policies WHERE schemaname = 'public';
-- Then drop each: DROP POLICY "policy_name" ON table_name;
```

### Rollback Migration 0006
```sql
-- Drop audit log table
DROP TABLE IF EXISTS public.admin_audit_log;

-- Drop index
DROP INDEX IF EXISTS idx_users_role;

-- Remove role column
ALTER TABLE public.users DROP COLUMN IF EXISTS role;
```

---

## 📊 Migration Status Tracking

Track your migration progress:

```sql
-- Create migration tracking table (optional)
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_name TEXT NOT NULL UNIQUE,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  executed_by TEXT
);

-- Record each migration as you run it
INSERT INTO public.schema_migrations (migration_name, executed_by)
VALUES ('0006_add_user_roles', current_user);

INSERT INTO public.schema_migrations (migration_name, executed_by)
VALUES ('0007_enable_row_level_security', current_user);

INSERT INTO public.schema_migrations (migration_name, executed_by)
VALUES ('0008_family_session_security', current_user);

-- Check migration history
SELECT * FROM public.schema_migrations ORDER BY executed_at;
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "column already exists" error
**Solution:** Column was added in previous attempt. Safe to continue with rest of migration.

### Issue 2: RLS causes API errors
**Cause:** Service role key not configured in API routes
**Solution:** Verify all API routes use `supabaseAdmin` (service role) not `supabase` (anon key)

### Issue 3: Admin routes still accessible by non-admins
**Cause:** Admin middleware not integrated into routes yet
**Solution:** This is expected. Phase 3 updates individual routes with `requireAdmin()` check

### Issue 4: Family sessions immediately expired
**Cause:** Existing sessions have old `expires_at`
**Solution:** Run this to extend active sessions:
```sql
UPDATE public.family_sessions
SET
  expires_at = NOW() + INTERVAL '7 days',
  absolute_expires_at = NOW() + INTERVAL '30 days'
WHERE expires_at < NOW();
```

---

## 📈 Next Steps After Migration

Once all 3 migrations are complete:

### Phase 3: Update Admin Routes (Code Changes)
1. Update all 8 admin routes with `requireAdmin()` check
2. Add `logAdminAction()` calls for audit trail
3. Test each route with admin and non-admin users
4. Deploy code changes

**Admin routes to update:**
- `/app/api/admin/test-accounts/route.ts`
- `/app/api/admin/test-accounts/delete/route.ts`
- `/app/api/admin/test-accounts/clean/route.ts`
- `/app/api/admin/test-accounts/clone/route.ts`
- `/app/api/admin/test-accounts/generate-prompts/route.ts`
- `/app/api/admin/test-accounts/milestone/route.ts`
- `/app/api/admin/prompts/route.ts`
- `/app/api/admin/test-prompt/route.ts`

### Phase 4: Update Family Sharing Routes (Code Changes)
1. Update `/app/api/family/stories/[userId]/route.ts` with userId filter
2. Update `/app/api/family/access/route.ts` with one-time tokens
3. Deploy code changes

---

## 🎯 Success Criteria

After all migrations:

- ✅ Admin users have `role = 'admin'` in database
- ✅ All critical tables show `rowsecurity = t`
- ✅ Family sessions have `absolute_expires_at` timestamp
- ✅ Audit log table exists and is empty
- ✅ No errors in application logs
- ✅ All existing functionality still works

---

## 🆘 Need Help?

If you encounter issues:

1. **Check Supabase logs:** Dashboard → Logs → PostgreSQL
2. **Verify table structure:** Dashboard → Table Editor
3. **Test with SQL:** Dashboard → SQL Editor
4. **Rollback if needed:** Use rollback commands above
5. **Contact support:** Include migration name and error message

---

**Migration Files:**
- `/migrations/0006_add_user_roles.sql`
- `/migrations/0007_enable_row_level_security.sql`
- `/migrations/0008_family_session_security.sql`

**Full Implementation Guide:** `SECURITY_REMEDIATION_PLAN.md`
