/**
 * Migration Script: Convert Existing Photos to Dual WebP Format
 *
 * This script migrates all existing story photos and treasures from single
 * JPEG/PNG files to dual WebP versions (Master + Display).
 *
 * Features:
 * - Batch processing (10 items at a time)
 * - Dry run mode for testing
 * - Progress tracking and logging
 * - Error handling with rollback
 * - Supports both story photos and treasures
 *
 * Usage:
 *   npm run migrate:webp              # Production run
 *   npm run migrate:webp -- --dry-run # Dry run (no changes)
 *   npm run migrate:webp -- --batch=5 # Custom batch size
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { processImageToWebP } from '../lib/imageProcessor';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Command line args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const batchSizeArg = args.find((arg) => arg.startsWith('--batch='));
const BATCH_SIZE = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 10;

// Statistics
const stats = {
  totalStories: 0,
  totalPhotos: 0,
  totalTreasures: 0,
  photosProcessed: 0,
  photosSkipped: 0,
  photosFailed: 0,
  treasuresProcessed: 0,
  treasuresSkipped: 0,
  treasuresFailed: 0,
  bytesProcessed: 0,
  startTime: Date.now(),
};

/**
 * Download image from Supabase Storage
 */
async function downloadImage(path: string): Promise<Buffer> {
  const { data, error } = await supabase.storage
    .from('heritage-whisper-files')
    .download(path);

  if (error || !data) {
    throw new Error(`Failed to download ${path}: ${error?.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Upload WebP to Supabase Storage
 */
async function uploadWebP(
  path: string,
  buffer: Buffer
): Promise<{ success: boolean; error?: string }> {
  if (isDryRun) {
    console.log(`    [DRY RUN] Would upload: ${path}`);
    return { success: true };
  }

  const { error } = await supabase.storage
    .from('heritage-whisper-files')
    .upload(path, buffer, {
      contentType: 'image/webp',
      upsert: false,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Migrate a single story photo
 */
async function migrateStoryPhoto(
  storyId: string,
  photo: any,
  photoIndex: number
): Promise<{ success: boolean; masterPath?: string; displayPath?: string; error?: string }> {
  try {
    // Skip if already migrated
    if (photo.masterPath && photo.displayPath) {
      console.log(`    Photo ${photoIndex + 1}: Already migrated (has dual paths)`);
      stats.photosSkipped++;
      return { success: true, masterPath: photo.masterPath, displayPath: photo.displayPath };
    }

    // Skip if no URL
    if (!photo.url && !photo.filePath) {
      console.log(`    Photo ${photoIndex + 1}: Skipping (no URL or path)`);
      stats.photosSkipped++;
      return { success: true };
    }

    const originalPath = photo.filePath || extractPathFromUrl(photo.url);
    if (!originalPath) {
      console.log(`    Photo ${photoIndex + 1}: Skipping (couldn't extract path from URL)`);
      stats.photosSkipped++;
      return { success: true };
    }

    console.log(`    Photo ${photoIndex + 1}: Processing ${originalPath}`);

    // Download original image
    const originalBuffer = await downloadImage(originalPath);
    stats.bytesProcessed += originalBuffer.length;

    // Process to dual WebP
    const { master, display } = await processImageToWebP(originalBuffer);

    // Generate new paths with suffix naming
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const baseFilename = `photo/migrated/${storyId}/${timestamp}-${randomId}`;
    const masterPath = `${baseFilename}-master.webp`;
    const displayPath = `${baseFilename}-display.webp`;

    // Upload both versions
    const masterUpload = await uploadWebP(masterPath, master.buffer);
    if (!masterUpload.success) {
      throw new Error(`Master upload failed: ${masterUpload.error}`);
    }

    const displayUpload = await uploadWebP(displayPath, display.buffer);
    if (!displayUpload.success) {
      // Rollback master upload
      if (!isDryRun) {
        await supabase.storage.from('heritage-whisper-files').remove([masterPath]);
      }
      throw new Error(`Display upload failed: ${displayUpload.error}`);
    }

    console.log(`    Photo ${photoIndex + 1}: ✓ Migrated (${formatBytes(originalBuffer.length)} → ${formatBytes(master.buffer.length + display.buffer.length)})`);
    stats.photosProcessed++;

    return { success: true, masterPath, displayPath };
  } catch (error: any) {
    console.error(`    Photo ${photoIndex + 1}: ✗ Failed - ${error.message}`);
    stats.photosFailed++;
    return { success: false, error: error.message };
  }
}

/**
 * Migrate all photos for a single story
 */
async function migrateStory(story: any): Promise<void> {
  console.log(`\n📖 Story: ${story.title || story.id}`);
  console.log(`   Photos: ${story.photos?.length || 0}`);

  if (!story.photos || story.photos.length === 0) {
    console.log('   Skipping (no photos)');
    return;
  }

  const updatedPhotos = [];
  for (let i = 0; i < story.photos.length; i++) {
    const photo = story.photos[i];
    const result = await migrateStoryPhoto(story.id, photo, i);

    if (result.success) {
      updatedPhotos.push({
        ...photo,
        masterPath: result.masterPath || photo.masterPath,
        displayPath: result.displayPath || photo.displayPath,
        masterUrl: result.masterPath ? undefined : photo.masterUrl,
        displayUrl: result.displayPath ? undefined : photo.displayUrl,
      });
    } else {
      // Keep original photo on failure
      updatedPhotos.push(photo);
    }
  }

  // Update story with new photo paths
  if (!isDryRun) {
    const { error } = await supabase
      .from('stories')
      .update({ photos: updatedPhotos })
      .eq('id', story.id);

    if (error) {
      console.error(`   ✗ Failed to update story: ${error.message}`);
    } else {
      console.log('   ✓ Story updated');
    }
  } else {
    console.log('   [DRY RUN] Would update story with new photo paths');
  }
}

/**
 * Migrate a single treasure
 */
async function migrateTreasure(treasure: any): Promise<void> {
  console.log(`\n🎁 Treasure: ${treasure.title || treasure.id}`);

  try {
    // Skip if already migrated
    if (treasure.master_path && treasure.display_path) {
      console.log('   Already migrated (has dual paths)');
      stats.treasuresSkipped++;
      return;
    }

    // Skip if no image
    if (!treasure.image_url) {
      console.log('   Skipping (no image URL)');
      stats.treasuresSkipped++;
      return;
    }

    const originalPath = extractPathFromUrl(treasure.image_url);
    if (!originalPath) {
      console.log('   Skipping (couldn\'t extract path from URL)');
      stats.treasuresSkipped++;
      return;
    }

    console.log(`   Processing: ${originalPath}`);

    // Download original image
    const originalBuffer = await downloadImage(originalPath);
    stats.bytesProcessed += originalBuffer.length;

    // Process to dual WebP
    const { master, display } = await processImageToWebP(originalBuffer);

    // Generate new paths
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const baseFilename = `treasure/migrated/${treasure.user_id}/${timestamp}-${randomId}`;
    const masterPath = `${baseFilename}-master.webp`;
    const displayPath = `${baseFilename}-display.webp`;

    // Upload both versions
    const masterUpload = await uploadWebP(masterPath, master.buffer);
    if (!masterUpload.success) {
      throw new Error(`Master upload failed: ${masterUpload.error}`);
    }

    const displayUpload = await uploadWebP(displayPath, display.buffer);
    if (!displayUpload.success) {
      // Rollback master upload
      if (!isDryRun) {
        await supabase.storage.from('heritage-whisper-files').remove([masterPath]);
      }
      throw new Error(`Display upload failed: ${displayUpload.error}`);
    }

    console.log(`   ✓ Migrated (${formatBytes(originalBuffer.length)} → ${formatBytes(master.buffer.length + display.buffer.length)})`);
    stats.treasuresProcessed++;

    // Update treasure with new paths
    if (!isDryRun) {
      const { error } = await supabase
        .from('treasures')
        .update({
          master_path: masterPath,
          display_path: displayPath,
        })
        .eq('id', treasure.id);

      if (error) {
        console.error(`   ✗ Failed to update treasure: ${error.message}`);
      } else {
        console.log('   ✓ Treasure updated');
      }
    } else {
      console.log('   [DRY RUN] Would update treasure with new paths');
    }
  } catch (error: any) {
    console.error(`   ✗ Failed - ${error.message}`);
    stats.treasuresFailed++;
  }
}

/**
 * Extract file path from signed URL or public URL
 */
function extractPathFromUrl(url: string): string | null {
  if (!url) return null;

  // Skip blob URLs
  if (url.startsWith('blob:')) return null;

  // Extract from Supabase signed URL
  const signedMatch = url.match(/\/storage\/v1\/object\/sign\/[^/]+\/(.+?)\?/);
  if (signedMatch) return signedMatch[1];

  // Extract from Supabase public URL
  const publicMatch = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+?)$/);
  if (publicMatch) return publicMatch[1];

  // Try to extract anything after the bucket name
  const bucketMatch = url.match(/heritage-whisper-files\/(.+?)(?:\?|$)/);
  if (bucketMatch) return bucketMatch[1];

  return null;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 WebP Migration Script');
  console.log('========================\n');
  console.log(`Mode: ${isDryRun ? '🧪 DRY RUN (no changes will be made)' : '⚠️  PRODUCTION'}`);
  console.log(`Batch size: ${BATCH_SIZE}\n`);

  // Fetch all stories with photos
  const { data: stories, error: storiesError } = await supabase
    .from('stories')
    .select('id, user_id, title, photos')
    .not('photos', 'is', null);

  if (storiesError) {
    console.error('❌ Failed to fetch stories:', storiesError.message);
    process.exit(1);
  }

  stats.totalStories = stories?.length || 0;
  stats.totalPhotos = stories?.reduce((sum, s) => sum + (s.photos?.length || 0), 0) || 0;

  console.log(`Found ${stats.totalStories} stories with ${stats.totalPhotos} photos\n`);

  // Fetch all treasures
  const { data: treasures, error: treasuresError } = await supabase
    .from('treasures')
    .select('id, user_id, title, image_url, master_path, display_path')
    .not('image_url', 'is', null);

  if (treasuresError) {
    console.error('❌ Failed to fetch treasures:', treasuresError.message);
    process.exit(1);
  }

  stats.totalTreasures = treasures?.length || 0;

  console.log(`Found ${stats.totalTreasures} treasures\n`);

  // Process stories in batches
  if (stories && stories.length > 0) {
    console.log('=== MIGRATING STORIES ===\n');
    for (let i = 0; i < stories.length; i += BATCH_SIZE) {
      const batch = stories.slice(i, i + BATCH_SIZE);
      console.log(`\nProcessing stories ${i + 1}-${i + batch.length} of ${stories.length}...`);

      for (const story of batch) {
        await migrateStory(story);
      }

      // Brief pause between batches
      if (i + BATCH_SIZE < stories.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // Process treasures in batches
  if (treasures && treasures.length > 0) {
    console.log('\n\n=== MIGRATING TREASURES ===\n');
    for (let i = 0; i < treasures.length; i += BATCH_SIZE) {
      const batch = treasures.slice(i, i + BATCH_SIZE);
      console.log(`\nProcessing treasures ${i + 1}-${i + batch.length} of ${treasures.length}...`);

      for (const treasure of batch) {
        await migrateTreasure(treasure);
      }

      // Brief pause between batches
      if (i + BATCH_SIZE < treasures.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // Print summary
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  console.log('\n\n=== MIGRATION SUMMARY ===\n');
  console.log(`Duration: ${duration}s`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'PRODUCTION'}\n`);
  console.log(`Stories processed: ${stats.totalStories}`);
  console.log(`Photos processed: ${stats.photosProcessed}`);
  console.log(`Photos skipped: ${stats.photosSkipped}`);
  console.log(`Photos failed: ${stats.photosFailed}\n`);
  console.log(`Treasures processed: ${stats.treasuresProcessed}`);
  console.log(`Treasures skipped: ${stats.treasuresSkipped}`);
  console.log(`Treasures failed: ${stats.treasuresFailed}\n`);
  console.log(`Data processed: ${formatBytes(stats.bytesProcessed)}`);

  if (stats.photosFailed > 0 || stats.treasuresFailed > 0) {
    console.log('\n⚠️  Some items failed to migrate. Check logs above for details.');
  }

  if (isDryRun) {
    console.log('\n🧪 This was a dry run. No changes were made to the database or storage.');
  } else {
    console.log('\n✅ Migration complete!');
  }
}

// Run migration
migrate().catch((error) => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
