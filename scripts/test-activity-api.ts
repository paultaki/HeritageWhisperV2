import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testActivityAPI() {
  console.log('🧪 Testing Activity API...\n');

  // Get a real user from database
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email, name')
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.error('❌ No users found in database');
    return;
  }

  const testUser = users[0];
  console.log('👤 Test user:', testUser.email);
  console.log('   ID:', testUser.id);

  // Get a story from this user
  const { data: stories, error: storyError } = await supabase
    .from('stories')
    .select('id, title')
    .eq('user_id', testUser.id)
    .limit(1);

  if (storyError || !stories || stories.length === 0) {
    console.log('⚠️  No stories found for this user');
  }

  const testStory = stories?.[0];

  // Test 1: Direct insert to activity_events table
  console.log('\n📝 Test 1: Direct insert to activity_events table');
  const { data: insertData, error: insertError } = await supabase
    .from('activity_events')
    .insert({
      user_id: testUser.id,
      actor_id: testUser.id,
      story_id: testStory?.id || null,
      event_type: 'story_listened',
      metadata: {
        test: true,
        title: testStory?.title || 'Test',
      },
    })
    .select();

  if (insertError) {
    console.error('❌ Direct insert failed:', insertError);
  } else {
    console.log('✅ Direct insert successful:', insertData);
  }

  // Test 2: Try API endpoint through HTTP
  console.log('\n📝 Test 2: Test API endpoint (would need server running)');
  console.log('   To test API manually, start dev server and run:');
  console.log('   curl -X POST http://localhost:3000/api/activity \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log(`     -d '{"eventType":"story_listened","storytellerId":"${testUser.id}","storyId":"${testStory?.id || 'null'}","metadata":{"test":true}}'`);

  // Check if event was created
  console.log('\n📊 Checking activity_events table...');
  const { data: events, error: eventsError } = await supabase
    .from('activity_events')
    .select('*')
    .eq('user_id', testUser.id)
    .order('occurred_at', { ascending: false })
    .limit(5);

  if (eventsError) {
    console.error('❌ Error fetching events:', eventsError);
  } else if (events && events.length > 0) {
    console.log(`✅ Found ${events.length} event(s) for this user:`);
    events.forEach((event: any) => {
      console.log(`  - ${event.event_type} at ${event.occurred_at}`);
    });
  } else {
    console.log('📭 No events found for this user');
  }
}

testActivityAPI()
  .then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
