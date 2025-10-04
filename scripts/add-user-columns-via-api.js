require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function addColumns() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('Adding missing columns to users table via Supabase...');

    // Check current table structure first
    const { data: existingColumns, error: checkError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('Error checking table:', checkError);
    } else {
      console.log('Current columns:', Object.keys(existingColumns[0] || {}));
    }

    // Use RPC to execute SQL (if you have a function) or use Supabase SQL editor
    console.log('\n⚠️  Manual action required:');
    console.log('Please run this SQL in your Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/tjycibrhoammxohemyhq/sql/new\n');
    console.log(`
ALTER TABLE users
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS story_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
    `);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addColumns();
