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

async function checkActivityTable() {
  console.log('🔍 Checking activity_events table...\n');

  // Check if table exists
  const { data: tables, error: tablesError } = await supabase
    .from('activity_events')
    .select('*')
    .limit(1);

  if (tablesError) {
    if (tablesError.message.includes('does not exist')) {
      console.error('❌ Table activity_events does NOT exist');
      console.error('   Run migration: migrations/0043_add_activity_events.sql');
      return;
    }
    console.error('❌ Error checking table:', tablesError);
    return;
  }

  console.log('✅ Table activity_events EXISTS');

  // Count total events
  const { count, error: countError } = await supabase
    .from('activity_events')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error counting events:', countError);
  } else {
    console.log(`📊 Total events: ${count || 0}`);
  }

  // Get recent events
  const { data: events, error: eventsError } = await supabase
    .from('activity_events')
    .select('*')
    .order('occurred_at', { ascending: false })
    .limit(10);

  if (eventsError) {
    console.error('❌ Error fetching events:', eventsError);
  } else if (events && events.length > 0) {
    console.log(`\n📋 Recent events (${events.length}):`);
    events.forEach((event: any) => {
      console.log(`  - ${event.event_type} at ${event.occurred_at}`);
      console.log(`    userId: ${event.user_id}`);
      console.log(`    actorId: ${event.actor_id || 'null'}`);
      console.log(`    storyId: ${event.story_id || 'null'}`);
    });
  } else {
    console.log('\n📭 No events found (this is expected if just starting)');
  }
}

checkActivityTable()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
