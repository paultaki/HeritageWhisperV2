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

console.log('\n=== STEP 1: ALL TABLES ===');
const { data: tables, error: tablesError } = await supabase
  .from('information_schema.tables')
  .select('table_name')
  .eq('table_schema', 'public')
  .order('table_name');

if (tablesError) {
  console.error('Error fetching tables:', tablesError);
} else {
  console.log('Tables in public schema:');
  tables?.forEach(t => console.log(`  - ${t.table_name}`));
}

console.log('\n=== STEP 2: STORIES TABLE STRUCTURE ===');
const { data: storyColumns, error: columnsError } = await supabase
  .rpc('get_table_columns', { table_name: 'stories' })
  .limit(1);

console.log('Fetching sample stories...');
const { data: stories, error: storiesError } = await supabase
  .from('stories')
  .select('*')
  .limit(5);

if (storiesError) {
  console.error('Error fetching stories:', storiesError);
} else {
  console.log(`Found ${stories?.length} sample stories`);
  if (stories && stories.length > 0) {
    console.log('\nColumn names:');
    Object.keys(stories[0]).forEach(col => {
      const value = stories[0][col];
      const type = value === null ? 'null' : typeof value;
      console.log(`  - ${col} (${type})`);
    });

    console.log('\nSample story data (first row):');
    console.log(JSON.stringify(stories[0], null, 2));
  }
}

console.log('\n=== STEP 3: USERS TABLE ===');
const { data: users, error: usersError } = await supabase
  .from('users')
  .select('id, email, name, birth_year, created_at, story_count')
  .order('created_at', { ascending: false });

if (usersError) {
  console.error('Error fetching users:', usersError);
} else {
  console.log(`\nFound ${users?.length} users:`);
  users?.forEach((user, idx) => {
    console.log(`\n${idx + 1}. ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Birth Year: ${user.birth_year}`);
    console.log(`   Stories: ${user.story_count || 0}`);
    console.log(`   Created: ${user.created_at}`);
  });
}

process.exit(0);
