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

// Get one complete story to see the structure
const { data: story, error } = await supabase
  .from('stories')
  .select('*')
  .eq('user_id', DEMO_USER_ID)
  .eq('id', 'd5e1d382-6f52-40c0-95ba-e1ef61bd73dd') // "Taste of Responsibility"
  .single();

if (error) {
  console.error('Error:', error);
} else {
  console.log('=== COMPLETE STORY DATA ===\n');
  console.log(JSON.stringify(story, null, 2));

  // Save to file for review
  writeFileSync('demo_story_sample.json', JSON.stringify(story, null, 2));
  console.log('\n✅ Saved to demo_story_sample.json');
}

process.exit(0);
