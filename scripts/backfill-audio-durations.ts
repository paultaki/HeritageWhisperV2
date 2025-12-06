/**
 * Migration Script: Backfill Missing Audio Durations
 *
 * This script finds all stories with audio files but missing duration_seconds,
 * downloads each audio file, calculates its duration, and updates the database.
 *
 * Features:
 * - Batch processing with configurable batch size
 * - Dry run mode for testing
 * - Progress tracking and logging
 * - Error handling (continues on individual failures)
 *
 * Usage:
 *   npx tsx scripts/backfill-audio-durations.ts              # Production run
 *   npx tsx scripts/backfill-audio-durations.ts --dry-run    # Dry run (no changes)
 *   npx tsx scripts/backfill-audio-durations.ts --batch=5    # Custom batch size
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import * as mm from 'music-metadata';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
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
  totalFound: 0,
  processed: 0,
  updated: 0,
  skipped: 0,
  failed: 0,
  errors: [] as { storyId: string; title: string; error: string }[],
  startTime: Date.now(),
};

/**
 * Extract storage path from a Supabase Storage URL
 */
function extractStoragePath(url: string): string | null {
  // URL format: https://xxx.supabase.co/storage/v1/object/public/heritage-whisper-files/path/to/file.webm
  // or: https://xxx.supabase.co/storage/v1/object/sign/heritage-whisper-files/path/to/file.webm?token=xxx
  const match = url.match(/heritage-whisper-files\/(.+?)(?:\?|$)/);
  return match ? match[1] : null;
}

/**
 * Download audio file from Supabase Storage
 */
async function downloadAudio(url: string): Promise<Buffer | null> {
  const path = extractStoragePath(url);

  if (!path) {
    // Try fetching directly from URL (for signed URLs or public URLs)
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      console.error(`    Failed to fetch from URL: ${err}`);
      return null;
    }
  }

  try {
    const { data, error } = await supabase.storage
      .from('heritage-whisper-files')
      .download(path);

    if (error || !data) {
      throw new Error(error?.message || 'No data returned');
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error(`    Failed to download from storage: ${err}`);
    return null;
  }
}

/**
 * Calculate audio duration from buffer using music-metadata
 */
async function getAudioDuration(buffer: Buffer, mimeType?: string): Promise<number | null> {
  try {
    const metadata = await mm.parseBuffer(buffer, mimeType || 'audio/webm');
    const duration = metadata.format.duration;

    if (duration && duration > 0) {
      return Math.round(duration);
    }
    return null;
  } catch (err) {
    console.error(`    Failed to parse audio metadata: ${err}`);
    return null;
  }
}

/**
 * Process a single story
 */
async function processStory(story: {
  id: string;
  title: string;
  audio_url: string;
}): Promise<boolean> {
  console.log(`  Processing: "${story.title}" (${story.id})`);

  // Download the audio file
  const audioBuffer = await downloadAudio(story.audio_url);
  if (!audioBuffer) {
    stats.errors.push({
      storyId: story.id,
      title: story.title,
      error: 'Failed to download audio file',
    });
    return false;
  }

  // Calculate duration
  const duration = await getAudioDuration(audioBuffer);
  if (!duration) {
    stats.errors.push({
      storyId: story.id,
      title: story.title,
      error: 'Failed to calculate audio duration',
    });
    return false;
  }

  console.log(`    Duration: ${duration} seconds`);

  // Update database (unless dry run)
  if (isDryRun) {
    console.log(`    [DRY RUN] Would update duration_seconds to ${duration}`);
    return true;
  }

  const { error: updateError } = await supabase
    .from('stories')
    .update({ duration_seconds: duration })
    .eq('id', story.id);

  if (updateError) {
    stats.errors.push({
      storyId: story.id,
      title: story.title,
      error: `Database update failed: ${updateError.message}`,
    });
    return false;
  }

  console.log(`    ✓ Updated duration_seconds to ${duration}`);
  return true;
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Audio Duration Backfill Migration');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
    console.log('');
  }

  // Fetch stories with audio but no duration
  console.log('Fetching stories with missing audio durations...');

  const { data: stories, error: fetchError } = await supabase
    .from('stories')
    .select('id, title, audio_url, duration_seconds')
    .not('audio_url', 'is', null)
    .or('duration_seconds.is.null,duration_seconds.eq.0')
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error('❌ Failed to fetch stories:', fetchError.message);
    process.exit(1);
  }

  if (!stories || stories.length === 0) {
    console.log('');
    console.log('✅ No stories found with missing audio durations!');
    console.log('');
    return;
  }

  stats.totalFound = stories.length;
  console.log(`Found ${stories.length} stories with missing durations`);
  console.log('');

  // Process in batches
  for (let i = 0; i < stories.length; i += BATCH_SIZE) {
    const batch = stories.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(stories.length / BATCH_SIZE);

    console.log(`─── Batch ${batchNum}/${totalBatches} ───`);

    for (const story of batch) {
      stats.processed++;

      const success = await processStory(story);

      if (success) {
        stats.updated++;
      } else {
        stats.failed++;
      }
    }

    console.log('');
  }

  // Print summary
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Migration Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Total stories found:    ${stats.totalFound}`);
  console.log(`  Successfully updated:   ${stats.updated}`);
  console.log(`  Failed:                 ${stats.failed}`);
  console.log(`  Time elapsed:           ${elapsed}s`);
  console.log('');

  if (stats.errors.length > 0) {
    console.log('  Errors:');
    stats.errors.forEach(({ storyId, title, error }) => {
      console.log(`    - "${title}" (${storyId}): ${error}`);
    });
    console.log('');
  }

  if (isDryRun) {
    console.log('🔍 This was a DRY RUN. Run without --dry-run to apply changes.');
    console.log('');
  } else if (stats.updated > 0) {
    console.log('✅ Migration complete!');
    console.log('');
  }
}

// Run migration
migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
