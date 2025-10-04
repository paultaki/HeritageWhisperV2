require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function addColumns() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Adding missing columns to users table...');

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
      ADD COLUMN IF NOT EXISTS story_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
    `);

    console.log('✅ Successfully added columns to users table');

    // Verify the columns exist
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('\nUsers table structure:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addColumns();
