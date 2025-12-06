import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function check() {
  // Get the most recently created story
  const { data, error } = await supabase
    .from('stories')
    .select('id, title, audio_url, duration_seconds, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('5 most recent stories:\n');
  data?.forEach(s => {
    const hasAudio = s.audio_url ? 'YES' : 'NO';
    const duration = s.duration_seconds ?? 'NULL';
    const created = new Date(s.created_at).toLocaleString();
    console.log(`  "${s.title}"`);
    console.log(`    Duration: ${duration}s | Audio: ${hasAudio} | Created: ${created}\n`);
  });
}

check();
