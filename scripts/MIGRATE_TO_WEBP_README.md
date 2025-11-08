# WebP Migration Script

This script migrates all existing story photos and treasures from single JPEG/PNG files to dual WebP versions (Master + Display).

## ⚠️ IMPORTANT: Run Database Migration First!

**Before running the WebP migration script**, you MUST run the database migration to consolidate photo data:

1. Go to Supabase Dashboard → SQL Editor
2. Run: `/migrations/add-photos-column.sql`
3. Verify photos column exists and data migrated
4. Then run this WebP migration script

## Overview

The migration converts:
- **Story Photos**: From single `url` field → Dual `masterPath` + `displayPath` fields
- **Treasures**: From single `image_url` → Dual `master_path` + `display_path` fields

### Dual WebP Strategy

Each photo is converted to two optimized versions:
- **Master WebP**: 2400px width @ 85% quality (for future printing, 8" at 300 DPI)
- **Display WebP**: 550px width @ 80% quality (for online viewing, timeline/book views)

**Storage Optimization**: Display version is ~90% smaller than master, perfect for fast page loads.

## Prerequisites

1. Environment variables set in `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```

2. Dependencies installed:
   ```bash
   npm install
   ```

## Usage

### Dry Run (Recommended First)

Test the migration without making any changes:

```bash
npm run migrate:webp:dry
```

This will:
- ✅ Show what would be migrated
- ✅ Display statistics
- ❌ NOT upload any files
- ❌ NOT modify database

### Production Run

After verifying dry run results, run the actual migration:

```bash
npm run migrate:webp
```

⚠️ **Warning**: This will:
- Upload new WebP files to storage
- Update database records
- Cannot be easily undone (backup recommended)

### Custom Batch Size

Process items in smaller batches if needed:

```bash
npm run migrate:webp -- --batch=5
```

Default batch size is 10.

## What It Does

### For Each Story Photo:

1. **Check if already migrated**: Skips photos that already have `masterPath` and `displayPath`
2. **Download original**: Fetches the original JPEG/PNG from Supabase Storage
3. **Process to WebP**: Creates two optimized versions using Sharp
4. **Upload both**: Uploads master and display versions with suffix naming
5. **Update database**: Updates story's `photos` array with new paths
6. **Rollback on failure**: If display upload fails, removes the master file

### For Each Treasure:

1. **Check if already migrated**: Skips treasures with existing dual paths
2. **Download original**: Fetches from `image_url` path
3. **Process to WebP**: Creates master and display versions
4. **Upload both**: To `treasure/migrated/` directory
5. **Update database**: Sets `master_path` and `display_path` fields

## File Naming Convention

### Story Photos

**Before**: `photo/{userId}/{storyId}/{timestamp}.jpg`
**After**:
- Master: `photo/migrated/{storyId}/{timestamp}-{randomId}-master.webp`
- Display: `photo/migrated/{storyId}/{timestamp}-{randomId}-display.webp`

### Treasures

**Before**: `treasure/{userId}/{timestamp}.jpg`
**After**:
- Master: `treasure/migrated/{userId}/{timestamp}-{randomId}-master.webp`
- Display: `treasure/migrated/{userId}/{timestamp}-{randomId}-display.webp`

## Output Example

```
🚀 WebP Migration Script
========================

Mode: ⚠️  PRODUCTION
Batch size: 10

Found 42 stories with 87 photos
Found 15 treasures

=== MIGRATING STORIES ===

Processing stories 1-10 of 42...

📖 Story: My First Day at School
   Photos: 2
    Photo 1: Processing photo/abc123/xyz789/1234567890.jpg
    Photo 1: ✓ Migrated (2.1 MB → 450.3 KB)
    Photo 2: Already migrated (has dual paths)
   ✓ Story updated

...

=== MIGRATION SUMMARY ===

Duration: 45.2s
Mode: PRODUCTION

Stories processed: 42
Photos processed: 75
Photos skipped: 12
Photos failed: 0

Treasures processed: 14
Treasures skipped: 1
Treasures failed: 0

Data processed: 156.8 MB

✅ Migration complete!
```

## Error Handling

### Automatic Rollback

If display WebP upload fails, the script automatically:
1. Deletes the master WebP file
2. Logs the error
3. Keeps the original photo in the database
4. Continues with next photo

### Failed Migrations

Photos that fail to migrate:
- Are logged with error details
- Keep their original paths in database
- Can be re-processed by running the script again
- Don't block other photos from migrating

## Safety Features

✅ **Idempotent**: Safe to run multiple times (skips already-migrated items)
✅ **Non-destructive**: Original files remain in storage (can be cleaned up later)
✅ **Batch processing**: Avoids overwhelming the server
✅ **Progress tracking**: Shows detailed progress for each item
✅ **Error isolation**: One failure doesn't stop the entire migration

## Post-Migration

### Verify Results

1. Check a few stories in Timeline/Book view
2. Verify photos load correctly
3. Check storage bucket for new `migrated/` folders
4. Review migration summary for any failures

### Clean Up (Optional)

After verifying successful migration, you can:

1. **Delete old files** (saves storage space):
   ```sql
   -- List old files to delete (review first!)
   SELECT DISTINCT photo->>'url' FROM stories, jsonb_array_elements(photos) as photo
   WHERE photo->>'masterPath' IS NOT NULL;
   ```

2. **Remove deprecated fields** from database (after all clients updated):
   - Stories: `url` field in photos array
   - Treasures: `image_url` field

## Troubleshooting

### Script fails with "Missing Supabase credentials"

Check `.env.local` has both:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### "Failed to download" errors

- Verify file exists in Supabase Storage
- Check storage bucket permissions
- Ensure service role key has access

### "Invalid image file" errors

- Original file may be corrupted
- File format not supported by Sharp
- File is too large (>20000px)

### Out of memory errors

Reduce batch size:
```bash
npm run migrate:webp -- --batch=5
```

## Technical Details

### Dependencies

- **Sharp**: Image processing library
- **Supabase JS Client**: Database and storage access

### Processing Pipeline

```
Original JPEG/PNG
    ↓ Download from storage
    ↓ Buffer.from(arrayBuffer)
    ↓ processImageToWebP()
        ↓ Sharp: Rotate, resize to 2400px, WebP @ 85%, strip EXIF
        ↓ Sharp: Clone, resize to 550px, WebP @ 80%, strip EXIF
    ↓ Upload master.webp
    ↓ Upload display.webp (rollback master if fails)
    ↓ Update database with new paths
```

### Performance

- **Speed**: ~2 photos/second (depends on file sizes)
- **Memory**: ~50-100MB per batch
- **Network**: ~2-3 MB/s upload (dual files)

## Rollback (If Needed)

If migration causes issues:

1. **Restore database** from backup:
   ```sql
   -- Restore photos array from backup
   UPDATE stories SET photos = backup.photos FROM stories_backup backup WHERE stories.id = backup.id;

   -- Restore treasure paths
   UPDATE treasures SET master_path = NULL, display_path = NULL;
   ```

2. **Delete migrated files** from storage:
   ```bash
   # List files to delete
   supabase storage ls heritage-whisper-files/photo/migrated
   supabase storage ls heritage-whisper-files/treasure/migrated

   # Delete folders
   supabase storage rm heritage-whisper-files/photo/migrated --recursive
   supabase storage rm heritage-whisper-files/treasure/migrated --recursive
   ```

## Support

For issues or questions:
- Check migration logs for error details
- Review dry run output before production run
- Test on a single story first (edit script to limit query)
- Contact dev team if persistent failures

---

**Last Updated**: January 2025
**Script Location**: `/scripts/migrate-to-webp.ts`
**Documentation**: This file + implementation plan in conversation summary
