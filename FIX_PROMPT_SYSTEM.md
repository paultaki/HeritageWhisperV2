# Fix: Prompt System "Save for Later" and "Restore" Not Working

## Problem
The "Save for Later" and "Restore" buttons aren't working because the required database tables may not exist or have proper permissions.

## Solution

### Step 1: Run the Main Migration (SAFE VERSION)

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **tjycibrhoammxohemyhq**
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of: `/migrations/0002_add_ai_prompt_system_safe.sql`
   - **Note**: Use the `_safe.sql` version - it handles already-existing constraints
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see: "✓ AI Prompt System migration completed successfully!"

### Step 2: Verify Tables and Fix RLS Policies

1. In Supabase SQL Editor, create a **New Query**
2. Copy and paste the contents of: `/migrations/verify_and_fix_prompt_tables.sql`
3. Click **Run**
4. Check the **Results** panel for messages like:
   - ✓ active_prompts table exists
   - ✓ prompt_history table exists
   - ✓ RLS policies created successfully!

### Step 3: Test the Functionality

After running the migrations:

1. Go to `/prompts` page in your app
2. Try clicking **Save** on a prompt → should move to "Saved for Later" section
3. Expand "Saved for Later" section
4. Try clicking **Restore** → should move back to "Ready to Tell"

## Quick Check: Do Tables Exist?

Run this quick query in Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('active_prompts', 'prompt_history', 'character_evolution');
```

**Expected result:** All 3 tables should appear.

## If You Get Errors

### Error: "relation does not exist"
- **Solution:** Run Step 1 (main migration)

### Error: "permission denied" or "RLS policy"
- **Solution:** Run Step 2 (verify and fix script)

### Error: "No prompts found"
- **Reason:** You may not have any prompts generated yet
- **Solution:** Record a few stories first, then prompts will be generated automatically

## How It Works

1. **active_prompts** table stores current prompts (1-6 visible at a time)
2. **Save button** → Moves prompt to `prompt_history` with `outcome='skipped'`
3. **Delete button** → Permanently removes from `active_prompts`
4. **Restore button** → Moves prompt from `prompt_history` back to `active_prompts`

## Need Help?

If issues persist:
1. Check browser console for errors (F12 → Console tab)
2. Check Network tab for API response errors
3. Verify your Supabase project URL and keys are correct in `.env.local`
