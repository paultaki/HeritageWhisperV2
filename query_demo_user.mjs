import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

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

console.log('\n=== DEMO USER: hello@heritagewhisper.com ===');
console.log(`User ID: ${DEMO_USER_ID}\n`);

// Get full user profile
console.log('--- User Profile ---');
const { data: user, error: userError } = await supabase
  .from('users')
  .select('*')
  .eq('id', DEMO_USER_ID)
  .single();

if (userError) {
  console.error('Error fetching user:', userError);
} else {
  console.log(JSON.stringify(user, null, 2));
}

// Get all stories
console.log('\n--- Stories ---');
const { data: stories, error: storiesError } = await supabase
  .from('stories')
  .select('*')
  .eq('user_id', DEMO_USER_ID)
  .order('created_at', { ascending: false });

if (storiesError) {
  console.error('Error fetching stories:', storiesError);
} else {
  console.log(`Found ${stories?.length || 0} stories for demo user`);

  if (stories && stories.length > 0) {
    stories.forEach((story, idx) => {
      console.log(`\n${idx + 1}. ${story.title || '(Untitled)'}`);
      console.log(`   ID: ${story.id}`);
      console.log(`   Year: ${story.story_year || 'N/A'}`);
      console.log(`   Has audio: ${story.audio_url ? 'Yes' : 'No'}`);
      console.log(`   Has photos: ${story.photos && story.photos.length > 0 ? `Yes (${story.photos.length})` : 'No'}`);
      console.log(`   Transcription length: ${story.transcription?.length || 0} chars`);
      console.log(`   Created: ${story.created_at}`);
    });
  }
}

// Get photos (if there's a separate photos table)
console.log('\n--- Photos ---');
const { data: photos, error: photosError } = await supabase
  .from('photos')
  .select('*')
  .eq('user_id', DEMO_USER_ID);

if (photosError && photosError.code !== 'PGRST116') {
  console.error('Error fetching photos:', photosError);
} else if (photos) {
  console.log(`Found ${photos?.length || 0} photos`);
}

// Get family members
console.log('\n--- Family Members ---');
const { data: familyMembers, error: familyError } = await supabase
  .from('family_members')
  .select('*')
  .eq('storyteller_id', DEMO_USER_ID);

if (familyError && familyError.code !== 'PGRST116') {
  console.error('Error fetching family members:', familyError);
} else if (familyMembers) {
  console.log(`Found ${familyMembers?.length || 0} family members`);
  if (familyMembers && familyMembers.length > 0) {
    familyMembers.forEach((member, idx) => {
      console.log(`\n${idx + 1}. ${member.member_name || 'N/A'}`);
      console.log(`   Email: ${member.member_email || 'N/A'}`);
      console.log(`   Role: ${member.role || 'N/A'}`);
      console.log(`   Status: ${member.status || 'N/A'}`);
    });
  }
}

// Get treasures (My Treasures photos)
console.log('\n--- Treasures ---');
const { data: treasures, error: treasuresError } = await supabase
  .from('treasures')
  .select('*')
  .eq('user_id', DEMO_USER_ID);

if (treasuresError && treasuresError.code !== 'PGRST116') {
  console.error('Error fetching treasures:', treasuresError);
} else if (treasures) {
  console.log(`Found ${treasures?.length || 0} treasures`);
  if (treasures && treasures.length > 0) {
    treasures.forEach((treasure, idx) => {
      console.log(`\n${idx + 1}. ${treasure.title || '(Untitled)'}`);
      console.log(`   Description: ${treasure.description || 'N/A'}`);
      console.log(`   Year: ${treasure.year || 'N/A'}`);
    });
  }
}

console.log('\n=== SUMMARY ===');
console.log(`Total stories: ${stories?.length || 0}`);
console.log(`Total family members: ${familyMembers?.length || 0}`);
console.log(`Total treasures: ${treasures?.length || 0}`);

process.exit(0);
