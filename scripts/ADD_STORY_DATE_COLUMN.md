# Fix: Add story_date Column to Database

## Problem

The `story_date` column is defined in the Drizzle schema (`shared/schema.ts`) but does not exist in the actual Supabase database. This causes the error:

```
Could not find the 'story_date' column of 'stories' in the schema cache
```

## Solution

Run the following SQL in your Supabase Dashboard to add the missing column:

### Steps:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `tjycibrhoammxohemyhq`
3. Navigate to: **SQL Editor**
4. Create a new query and paste the SQL below:

```sql
-- Add story_date column to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS story_date TIMESTAMP;

-- Reload PostgREST schema cache so API recognizes the new column
NOTIFY pgrst, 'reload schema';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'stories' AND column_name = 'story_date';
```

5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see output confirming the column was added:

```
column_name | data_type              | is_nullable
story_date  | timestamp without time zone | YES
```

## After Running

Once this is complete:
- The PUT /api/stories/[id] endpoint will work correctly
- Users can save month/day along with year for their memories
- The 404 "Story not found" error when saving will be resolved

## Verification

To verify the fix worked, you can:

1. Try saving an existing story with a month and day
2. Check the server logs - you should no longer see the schema cache error
3. Or run this verification script:

```bash
npx tsx scripts/verify-story-date-column.ts
```

Expected output after fix:
```
Column story_date exists: true
```

## Migration File

The migration has also been saved to: `migrations/0015_ensure_story_date_column.sql`

For future deployments, this migration should be run as part of the deployment process.
