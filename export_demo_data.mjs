import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

// Load .env.local file
const envFile = readFileSync('.env.local', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    envVars[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

const DEMO_USER_ID = '38ad3036-e423-4e41-a3f3-020664a1ee0e';

console.log('🔄 Exporting demo data for public account...\n');

// 1. Get user profile
console.log('📋 Fetching user profile...');
const { data: user, error: userError } = await supabase
  .from('users')
  .select('*')
  .eq('id', DEMO_USER_ID)
  .single();

if (userError) {
  console.error('❌ Error fetching user:', userError);
  process.exit(1);
}

// 2. Get all stories
console.log('📚 Fetching all stories...');
const { data: stories, error: storiesError } = await supabase
  .from('stories')
  .select('*')
  .eq('user_id', DEMO_USER_ID)
  .order('created_at', { ascending: false });

if (storiesError) {
  console.error('❌ Error fetching stories:', storiesError);
  process.exit(1);
}

console.log(`   Found ${stories.length} stories`);

// 3. Get treasures
console.log('💎 Fetching treasures...');
const { data: treasures, error: treasuresError } = await supabase
  .from('treasures')
  .select('*')
  .eq('user_id', DEMO_USER_ID)
  .order('created_at', { ascending: false });

if (treasuresError) {
  console.error('❌ Error fetching treasures:', treasuresError);
  process.exit(1);
}

console.log(`   Found ${treasures.length} treasures`);

// 4. Generate signed URLs for photos (7 day expiry)
console.log('🖼️  Generating signed URLs for photos...');

const SEVEN_DAYS = 7 * 24 * 60 * 60; // seconds

for (const story of stories) {
  if (story.photos && Array.isArray(story.photos)) {
    for (const photo of story.photos) {
      // Generate signed URLs for display and master images
      if (photo.displayPath) {
        const { data: signedUrl } = await supabase.storage
          .from('heritage-whisper-files')
          .createSignedUrl(photo.displayPath, SEVEN_DAYS);

        if (signedUrl?.signedUrl) {
          photo.displayUrl = signedUrl.signedUrl;
        }
      }

      if (photo.masterPath) {
        const { data: signedUrl } = await supabase.storage
          .from('heritage-whisper-files')
          .createSignedUrl(photo.masterPath, SEVEN_DAYS);

        if (signedUrl?.signedUrl) {
          photo.masterUrl = signedUrl.signedUrl;
        }
      }

      // Fallback to old filePath if no new paths
      if (!photo.displayUrl && photo.filePath) {
        const { data: signedUrl } = await supabase.storage
          .from('heritage-whisper-files')
          .createSignedUrl(photo.filePath, SEVEN_DAYS);

        if (signedUrl?.signedUrl) {
          photo.url = signedUrl.signedUrl;
        }
      }
    }
  }
}

console.log('   ✅ Photo URLs generated');

// 5. Generate signed URLs for audio
console.log('🎵 Generating signed URLs for audio...');

for (const story of stories) {
  if (story.audio_url && story.audio_url.includes('heritage-whisper-files')) {
    // Extract path from URL
    const urlParts = story.audio_url.split('/heritage-whisper-files/');
    if (urlParts.length > 1) {
      const path = urlParts[1].split('?')[0]; // Remove any existing query params

      const { data: signedUrl } = await supabase.storage
        .from('heritage-whisper-files')
        .createSignedUrl(path, SEVEN_DAYS);

      if (signedUrl?.signedUrl) {
        story.audio_url = signedUrl.signedUrl;
      }
    }
  }
}

console.log('   ✅ Audio URLs generated');

// 6. Generate signed URL for profile photo
console.log('👤 Generating signed URL for profile photo...');

if (user.profile_photo_url && user.profile_photo_url.includes('heritage-whisper-files')) {
  const urlParts = user.profile_photo_url.split('/heritage-whisper-files/');
  if (urlParts.length > 1) {
    const path = urlParts[1].split('?')[0];

    const { data: signedUrl } = await supabase.storage
      .from('heritage-whisper-files')
      .createSignedUrl(path, SEVEN_DAYS);

    if (signedUrl?.signedUrl) {
      user.profile_photo_url = signedUrl.signedUrl;
    }
  }
}

console.log('   ✅ Profile photo URL generated');

// 7. Generate signed URLs for treasures
console.log('💎 Generating signed URLs for treasures...');

for (const treasure of treasures) {
  if (treasure.photo_path) {
    const { data: signedUrl } = await supabase.storage
      .from('heritage-whisper-files')
      .createSignedUrl(treasure.photo_path, SEVEN_DAYS);

    if (signedUrl?.signedUrl) {
      treasure.photo_url = signedUrl.signedUrl;
    }
  }
}

console.log('   ✅ Treasure URLs generated');

// 8. Create export object
const exportData = {
  exportedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + SEVEN_DAYS * 1000).toISOString(),
  note: "Signed URLs expire after 7 days. Regenerate export for fresh URLs.",
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
    birthYear: user.birth_year,
    bio: user.bio,
    profilePhotoUrl: user.profile_photo_url,
    profileInterests: user.profile_interests,
    storyCount: stories.length,
    createdAt: user.created_at,
  },
  stories: stories.map(story => ({
    id: story.id,
    title: story.title,
    year: story.year,
    storyDate: story.story_date,
    transcript: story.transcript,
    wisdomText: story.wisdom_text,
    audioUrl: story.audio_url,
    durationSeconds: story.duration_seconds,
    photos: story.photos || [],
    includeInBook: story.include_in_book,
    includeInTimeline: story.include_in_timeline,
    isFavorite: story.is_favorite,
    metadata: story.metadata,
    createdAt: story.created_at,
    updatedAt: story.updated_at,
  })),
  treasures: treasures.map(treasure => ({
    id: treasure.id,
    title: treasure.title,
    description: treasure.description,
    year: treasure.year,
    photoUrl: treasure.photo_url,
    photoPath: treasure.photo_path,
    transform: treasure.transform,
    createdAt: treasure.created_at,
  })),
  stats: {
    totalStories: stories.length,
    totalTreasures: treasures.length,
    storiesWithAudio: stories.filter(s => s.audio_url).length,
    storiesWithPhotos: stories.filter(s => s.photos && s.photos.length > 0).length,
    storiesWithWisdom: stories.filter(s => s.wisdom_text).length,
  }
};

// 9. Save to file
const filename = 'public/demo-data.json';
writeFileSync(filename, JSON.stringify(exportData, null, 2));

console.log('\n✅ Export complete!');
console.log(`📁 Saved to: ${filename}`);
console.log(`\n📊 Statistics:`);
console.log(`   - Total stories: ${exportData.stats.totalStories}`);
console.log(`   - Stories with audio: ${exportData.stats.storiesWithAudio}`);
console.log(`   - Stories with photos: ${exportData.stats.storiesWithPhotos}`);
console.log(`   - Stories with wisdom: ${exportData.stats.storiesWithWisdom}`);
console.log(`   - Total treasures: ${exportData.stats.totalTreasures}`);
console.log(`\n⚠️  Note: Signed URLs expire on ${new Date(Date.now() + SEVEN_DAYS * 1000).toLocaleDateString()}`);
console.log('    Regenerate export for fresh URLs after expiration.\n');

process.exit(0);
