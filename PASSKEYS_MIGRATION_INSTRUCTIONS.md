# Passkeys Table Migration Instructions

## Overview
This migration adds the `passkeys` table for WebAuthn passwordless authentication support.

## Migration File
Location: `/migrations/add_passkeys_table_v2.sql`

## Manual Execution Steps

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `tjycibrhoammxohemyhq`

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy & Paste SQL**
   - Open: `/migrations/add_passkeys_table_v2.sql`
   - Copy entire file contents
   - Paste into SQL Editor

4. **Execute Migration**
   - Click "Run" button
   - Verify success message

5. **Verify Table Creation**
   - Go to "Table Editor"
   - Look for `passkeys` table
   - Confirm columns exist:
     - `id`, `user_id`, `credential_id`, `public_key`
     - `sign_count`, `transports`, `friendly_name`
     - `created_at`, `last_used_at`

---

### Option 2: Command Line (if psql installed)

```bash
# Set DATABASE_URL environment variable first
export DATABASE_URL="postgresql://..."

# Run migration
psql $DATABASE_URL -f migrations/add_passkeys_table_v2.sql
```

---

## What This Migration Does

### Creates `passkeys` Table
- **Purpose:** Store WebAuthn credentials for passwordless login
- **Columns:**
  - `credential_id`: Base64url-encoded credential ID (unique per user)
  - `public_key`: Base64url-encoded public key for verification
  - `sign_count`: Counter for replay attack detection
  - `transports`: Available transports (USB, NFC, internal, etc.)
  - `friendly_name`: User-friendly label ("MacBook Touch ID", etc.)

### Security Features
- **Row Level Security (RLS):** Users can only access their own passkeys
- **Cascade Delete:** Passkeys deleted when user account is deleted
- **Unique Constraint:** Prevents duplicate credentials per user

### Indexes
- `idx_passkeys_user_id`: Fast lookup by user
- `idx_passkeys_credential_id`: Fast lookup by credential

---

## Post-Migration Verification

Run this query in SQL Editor to verify:

```sql
-- Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'passkeys'
);

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'passkeys';

-- Check policies exist
SELECT policyname
FROM pg_policies
WHERE tablename = 'passkeys';
```

Expected results:
- ✅ Table exists: `true`
- ✅ RLS enabled: `true`
- ✅ 4 policies: view, insert, update, delete (all "own passkeys")

---

## GDPR Compliance Update

After running this migration, the `passkeys` table is now **ACTIVE** and must be included in:

### 1. Data Export (`/api/user/export`)
Add to export queries:
```typescript
const passkeysData = await db
  .select()
  .from(passkeys)
  .where(eq(passkeys.userId, userId));
```

### 2. Data Deletion (`/api/user/delete`)
Add before user deletion:
```typescript
await db.delete(passkeys).where(eq(passkeys.userId, userId));
logger.debug("[Account Deletion] Deleted passkey credentials");
```

### 3. Documentation
- ✅ Already included in `GDPR_DATA_INVENTORY.md` (Section 1.1, row 21)
- ✅ Export query provided (Section 2.11)
- ✅ Deletion code provided (Section 4.1, step 9)

---

## Rollback (if needed)

If you need to remove the table:

```sql
DROP TABLE IF EXISTS passkeys CASCADE;
```

⚠️ **Warning:** This will permanently delete all passkey credentials.

---

## Next Steps

After migration completes:

1. **Update `/app/api/user/delete/route.ts`**
   - Add passkeys deletion code (see GDPR doc Section 4.1)

2. **Update `/app/api/user/export/route.ts`**
   - Add passkeys export query (see GDPR doc Section 2.11)

3. **Test WebAuthn Registration**
   - Create passkey for test user
   - Verify it appears in `passkeys` table
   - Test authentication flow

4. **Test GDPR Compliance**
   - Export test user data (verify passkeys included)
   - Delete test user account (verify passkeys deleted)

---

## Troubleshooting

### Error: "permission denied for table passkeys"
- Ensure you're using service role key
- Check RLS policies are correctly defined

### Error: "relation passkeys already exists"
- Table might exist from previous attempt
- Run: `DROP TABLE passkeys CASCADE;` first
- Then re-run migration

### Error: "foreign key constraint violation"
- Ensure `users` table exists first
- Check `user_id` references are correct

---

**Migration Status:** ⏳ Pending Execution

**Document Updated:** October 24, 2025
