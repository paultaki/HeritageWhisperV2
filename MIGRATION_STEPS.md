# Complete Migration Guide: Photos to Dual WebP

Follow these steps in order to migrate all existing photos to the dual WebP format.

## Step 1: Database Migration (Run in Supabase)

### 1.1 Go to Supabase Dashboard

Navigate to: https://supabase.com/dashboard/project/tjycibrhoammxohemyhq/sql

### 1.2 Open SQL Editor

Click "SQL Editor" in the left sidebar, then "New Query"

### 1.3 Copy and Run the Migration SQL

Open the file `/migrations/add-photos-column.sql` and copy ALL contents into Supabase SQL Editor.

**Or copy from here:**

```sql
-- Copy the entire contents of /migrations/add-photos-column.sql here
```

### 1.4 Click "Run" and Wait for Results

You should see output like:

```
NOTICE: ════════════════════════════════════════════════════════
NOTICE: Migration Complete: Photos Column Consolidation
NOTICE: ════════════════════════════════════════════════════════
NOTICE: Total stories: 42
NOTICE: Stories with legacy photo_url: 38
NOTICE: Stories with metadata.photos: 15
NOTICE: Stories with new photos column: 40
NOTICE: Legacy photos successfully migrated: 38
NOTICE: ════════════════════════════════════════════════════════
NOTICE: ✓ Migration appears successful!
```

✅ **Success indicators:**
- No errors
- "Migration appears successful!" message
- Number of migrated photos ≥ number of legacy photos

❌ **If you see errors:**
- Check error message
- Don't proceed to next steps
- Share error message for troubleshooting

---

## Step 2: Test the Database Migration

### 2.1 Run Verification Queries

In Supabase SQL Editor, run:

```sql
-- Check photo data distribution
SELECT
  COUNT(*) FILTER (WHERE photo_url IS NOT NULL) as has_legacy_photo_url,
  COUNT(*) FILTER (WHERE metadata ? 'photo_transform') as has_metadata_transform,
  COUNT(*) FILTER (WHERE metadata ? 'photos') as has_metadata_photos,
  COUNT(*) FILTER (WHERE photos IS NOT NULL AND jsonb_array_length(photos) > 0) as has_new_photos_array
FROM stories;
```

Expected result: `has_new_photos_array` should be ≥ `has_legacy_photo_url`

### 2.2 Sample Migrated Stories

```sql
-- View first 5 migrated stories
SELECT
  id,
  title,
  photo_url as legacy_photo_url,
  photos as new_photos_array,
  jsonb_array_length(COALESCE(photos, '[]'::jsonb)) as photo_count
FROM stories
WHERE photos IS NOT NULL AND jsonb_array_length(photos) > 0
LIMIT 5;
```

You should see stories with `photos` arrays containing your photo objects.

---

## Step 3: Run WebP Conversion (Dry Run First)

### 3.1 Navigate to Project Directory

```bash
cd HeritageWhisperV2
```

### 3.2 Run Dry Run (Safe - No Changes)

```bash
npm run migrate:webp:dry
```

This will show you:
- How many stories/photos will be migrated
- File size savings
- Which photos would be skipped (already migrated)

**Expected output:**

```
🚀 WebP Migration Script
========================

Mode: 🧪 DRY RUN (no changes will be made)
Batch size: 10

Found 42 stories with 85 photos
Found 15 treasures

=== MIGRATING STORIES ===

📖 Story: My First Day at School
   Photos: 2
    Photo 1: Processing photo/abc123/xyz789/1234567890.jpg
    Photo 1: ✓ Migrated (2.1 MB → 450.3 KB)
    Photo 2: Already migrated (has dual paths)
   ✓ Story updated

...

=== MIGRATION SUMMARY ===

Duration: 12.3s
Mode: DRY RUN

Photos processed: 75
Photos skipped: 10
Photos failed: 0

Data processed: 156.8 MB

🧪 This was a dry run. No changes were made.
```

✅ **If dry run looks good, proceed to Step 4**

❌ **If errors occur:**
- Check error messages
- Verify database migration completed successfully
- Ensure `.env.local` has Supabase credentials

---

## Step 4: Run Actual WebP Migration

### 4.1 Run Production Migration

⚠️ **This will upload new files and modify database records!**

```bash
npm run migrate:webp
```

This will:
- Download original photos
- Convert to dual WebP versions (Master + Display)
- Upload both versions to Supabase Storage
- Update database with new paths

**Expected duration:** ~2 photos/second (depends on file sizes and network)

### 4.2 Monitor Progress

Watch the output for:
- ✅ Each photo being processed
- ✅ File size savings
- ⚠️ Any errors (will continue with other photos)

### 4.3 Verify Completion

Check the final summary:

```
=== MIGRATION SUMMARY ===

Duration: 45.2s
Mode: PRODUCTION

Photos processed: 75
Photos skipped: 10
Photos failed: 0

Treasures processed: 14
Treasures skipped: 1
Treasures failed: 0

✅ Migration complete!
```

✅ **Success:** `failed` count is 0 (or very low)

⚠️ **If failures:** Review logs for specific errors, may need to re-run for failed items

---

## Step 5: Verify Photos Display Correctly

### 5.1 Check Timeline View

1. Go to https://dev.heritagewhisper.com/timeline
2. Scroll through stories
3. Verify photos load correctly
4. Check that zoom/crop transforms work

### 5.2 Check Book View

1. Go to https://dev.heritagewhisper.com/book
2. Navigate through pages
3. Verify photos display
4. Check image quality

### 5.3 Check Memory Box

1. Go to https://dev.heritagewhisper.com/memory-box
2. Check both Stories and Treasures tabs
3. Verify all images load

### 5.4 Check Storage in Supabase

1. Go to Supabase Dashboard → Storage
2. Navigate to `heritage-whisper-files` bucket
3. Look for new folders:
   - `photo/migrated/` - Story photos
   - `treasure/migrated/` - Treasures
4. Verify WebP files exist with `-master.webp` and `-display.webp` suffixes

---

## Step 6: (Optional) Clean Up Old Files

**⚠️ Only do this AFTER confirming everything works!**

After 1-2 weeks of successful operation, you can optionally:

### 6.1 Delete Old JPEG/PNG Files

```sql
-- List old photo files (REVIEW FIRST!)
SELECT DISTINCT
  jsonb_array_elements(photos)->>'url' as old_url
FROM stories
WHERE jsonb_array_elements(photos)->>'masterPath' IS NOT NULL;
```

Manually delete old files from Supabase Storage (keep for now as backup).

### 6.2 Remove Deprecated Database Fields

```sql
-- ONLY RUN THIS AFTER 100% CONFIDENCE
-- This is OPTIONAL and can wait

-- Remove legacy photo_url column (keeps data for rollback)
-- ALTER TABLE stories DROP COLUMN photo_url;
-- ALTER TABLE stories DROP COLUMN photo_transform;  -- This doesn't exist anyway
```

**Recommendation:** Keep `photo_url` for at least 1 month as rollback safety.

---

## Troubleshooting

### Migration Script Fails: "Missing Supabase credentials"

**Fix:** Ensure `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=https://tjycibrhoammxohemyhq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Error: "column stories.photos does not exist"

**Fix:** You didn't run Step 1 (database migration) first. Go back and run the SQL migration in Supabase.

### Photos Don't Display After Migration

**Possible causes:**
1. Signed URLs expired (regenerate by reloading page)
2. API still reading from old location
3. Browser cache - try hard refresh (Cmd+Shift+R)

**Check:**
```sql
-- Verify photos column has data
SELECT id, title, photos
FROM stories
WHERE photos IS NOT NULL
LIMIT 5;
```

### Some Photos Failed to Migrate

**Recovery:**
- Check error logs for specific files
- Verify files exist in Storage
- Re-run migration script (it will skip already-migrated photos)
- Failed photos will keep their original paths (safe fallback)

---

## Success Criteria

✅ Database migration completed without errors
✅ Dry run shows expected photo count
✅ Production migration completes with 0-1% failure rate
✅ Timeline view shows all photos
✅ Book view displays photos correctly
✅ Memory Box treasures load
✅ New uploads create dual WebP versions automatically

---

## Rollback (If Needed)

If something goes wrong:

### Rollback Database Changes

```sql
-- Restore photos to metadata location
UPDATE stories
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{photos}',
  COALESCE(photos, '[]'::jsonb)
)
WHERE photos IS NOT NULL;

-- Clear photos column
UPDATE stories SET photos = '[]'::jsonb;
```

### Delete Migrated WebP Files

In Supabase Storage:
1. Delete `/photo/migrated/` folder
2. Delete `/treasure/migrated/` folder

### Redeploy Previous Code Version

```bash
git revert <commit-hash>
git push
```

---

## Questions?

- Database migration issues → Check Supabase logs
- WebP script errors → Check console output
- Display issues → Check browser console
- Other issues → Share error messages for help
