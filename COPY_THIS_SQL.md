# ✅ COPY THIS SQL (Not the TypeScript file!)

## ⚠️ What Happened
You pasted the **TypeScript file** (`.ts`) into SQL editor. You need the **SQL file** (`.sql`) instead.

---

## 🎯 Correct Steps

### 1. Open Supabase SQL Editor
https://supabase.com/dashboard/project/tjycibrhoammxohemyhq/sql

### 2. Click "New query"

### 3. Copy ALL the SQL below and paste it:

```sql
-- Migration: Add passkeys table for WebAuthn authentication
-- Created: 2025-01-24

-- Drop existing table if it exists (and all dependent objects)
DROP TABLE IF EXISTS passkeys CASCADE;

-- Create passkeys table with correct schema
CREATE TABLE passkeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  sign_count BIGINT NOT NULL DEFAULT 0,
  credential_backed_up BOOLEAN,
  credential_device_type TEXT, -- 'singleDevice' or 'multiDevice'
  transports JSONB, -- Array of transport types: 'ble', 'internal', 'nfc', 'usb', 'cable', 'hybrid'
  friendly_name TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP,

  -- Unique constraint on user_id + credential_id to prevent cross-tenant clashes
  CONSTRAINT unique_user_credential UNIQUE (user_id, credential_id)
);

-- Create indexes for performance
CREATE INDEX idx_passkeys_user_id ON passkeys(user_id);
CREATE INDEX idx_passkeys_credential_id ON passkeys(credential_id);

-- Enable Row Level Security
ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own passkeys
CREATE POLICY "Users can view own passkeys"
  ON passkeys FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own passkeys
CREATE POLICY "Users can insert own passkeys"
  ON passkeys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own passkeys
CREATE POLICY "Users can update own passkeys"
  ON passkeys FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own passkeys
CREATE POLICY "Users can delete own passkeys"
  ON passkeys FOR DELETE
  USING (auth.uid() = user_id);

-- Add table and column comments
COMMENT ON TABLE passkeys IS 'WebAuthn passkeys for passwordless authentication';
COMMENT ON COLUMN passkeys.credential_id IS 'Base64url-encoded credential ID';
COMMENT ON COLUMN passkeys.public_key IS 'Base64url-encoded public key';
COMMENT ON COLUMN passkeys.sign_count IS 'Counter for replay attack detection';
COMMENT ON COLUMN passkeys.credential_backed_up IS 'Whether the credential is backed up (multi-device)';
COMMENT ON COLUMN passkeys.credential_device_type IS 'Device type: singleDevice or multiDevice';
COMMENT ON COLUMN passkeys.transports IS 'Available transports for this credential';
COMMENT ON COLUMN passkeys.friendly_name IS 'User-friendly name for the passkey';
```

### 4. Click "Run" ▶️

### 5. Verify Success
You should see: `Success. No rows returned`

---

## ✅ What This Creates

- **Table:** `passkeys` with WebAuthn credentials
- **Security:** Row Level Security (users see only their passkeys)
- **Cascade:** Auto-deletes passkeys when user deleted
- **Indexes:** Fast lookups on `user_id` and `credential_id`

---

## 🔍 Verify It Worked

Run this query after:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'passkeys';
```

Expected result:
```
tablename | rowsecurity
----------|------------
passkeys  | true
```

---

## ❌ Files NOT to Use

- ~~`scripts/run-passkeys-migration.ts`~~ (deleted - was misleading)
- Any `.ts` or `.tsx` files

## ✅ File to Use

- `migrations/add_passkeys_table_v2.sql` (the SQL above is copied from this)

---

## 📋 Next Steps (After SQL Runs)

1. ✅ Migration complete
2. Update `/app/api/user/delete/route.ts` (add passkeys deletion)
3. Update `/app/api/user/export/route.ts` (add passkeys export)
4. Test passkey registration

All code for steps 2-3 is in `GDPR_DATA_INVENTORY.md`

---

**Just copy the SQL block above into Supabase SQL Editor and run it!**
