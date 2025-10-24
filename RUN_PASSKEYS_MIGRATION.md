# 🚀 Quick Start: Passkeys Migration

## ✅ Status: Ready to Execute

Your passkeys table schema is already defined in `/shared/schema.ts`. Just need to create the actual database table.

---

## 📋 Execute Migration (2 Minutes)

### Step 1: Open Supabase SQL Editor
https://supabase.com/dashboard/project/tjycibrhoammxohemyhq/sql

### Step 2: Click "New query"

### Step 3: Copy SQL
**IMPORTANT:** Copy from `/migrations/add_passkeys_table_v2.sql` (the `.sql` file, NOT any `.ts` files!)

Or see `COPY_THIS_SQL.md` for the exact SQL to paste.

### Step 4: Paste & Run
1. Paste SQL into editor
2. Click **"Run"** button ▶️
3. Expect: `Success. No rows returned` ✅

### Step 4: Verify (Optional)
Run this verification query:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'passkeys';
```

Expected: `passkeys | true` (RLS enabled)

---

## 🔐 What Gets Created

**Table:** `passkeys`
- Stores WebAuthn credentials for passwordless login
- Row Level Security enabled
- Cascade deletes with user account
- Unique constraint per user + credential

**Security:**
- ✅ Users can only access their own passkeys
- ✅ Auto-deleted when user account is deleted
- ✅ Replay attack protection (sign_count)

---

## 📦 Already Configured

✅ **Schema defined:** `/shared/schema.ts:71-99`
✅ **GDPR export query:** `/GDPR_DATA_INVENTORY.md` Section 2.11
✅ **GDPR deletion code:** `/GDPR_DATA_INVENTORY.md` Section 4.1 step 9
✅ **Migration SQL:** `/migrations/add_passkeys_table_v2.sql`

---

## 🎯 Next Steps (After Migration)

### 1. Update Deletion Endpoint
File: `/app/api/user/delete/route.ts`

Add before user deletion:
```typescript
// Delete passkeys
const { rows: passkeyCheck } = await db.execute(sql`
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'passkeys'
  )
`);

if (passkeyCheck[0].exists) {
  await db.delete(passkeys).where(eq(passkeys.userId, userId));
  logger.debug("[Account Deletion] Deleted passkey credentials");
}
```

### 2. Update Export Endpoint
File: `/app/api/user/export/route.ts`

Add to data export:
```typescript
// Export passkeys (if table exists)
const { rows: passkeyCheck } = await db.execute(sql`
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'passkeys'
  )
`);

let passkeysData = [];
if (passkeyCheck[0].exists) {
  passkeysData = await db.select().from(passkeys).where(eq(passkeys.userId, userId));
}

// Include in export JSON under "security" section
```

### 3. Import passkeys in API Routes
Add to imports:
```typescript
import { passkeys } from "@/shared/schema";
```

---

## ✅ Verification Checklist

After migration:
- [ ] Run SQL in Supabase dashboard
- [ ] Verify table exists in Table Editor
- [ ] Confirm RLS enabled
- [ ] Update `/app/api/user/delete/route.ts`
- [ ] Update `/app/api/user/export/route.ts`
- [ ] Test passkey registration (create one for test user)
- [ ] Test GDPR export (verify passkeys included)
- [ ] Test account deletion (verify passkeys deleted)

---

## 📚 Reference Documents

- **Full Instructions:** `/PASSKEYS_MIGRATION_INSTRUCTIONS.md`
- **GDPR Compliance:** `/GDPR_DATA_INVENTORY.md` Sections 2.11, 4.1
- **Migration SQL:** `/migrations/add_passkeys_table_v2.sql`
- **Schema Definition:** `/shared/schema.ts:71-99`

---

**Estimated Time:** 2 minutes to execute migration
**Impact:** Enables WebAuthn passwordless login
**GDPR Ready:** Export/deletion queries already documented

---

🔗 **Quick Link:** [Open Supabase SQL Editor](https://supabase.com/dashboard/project/tjycibrhoammxohemyhq/sql)
