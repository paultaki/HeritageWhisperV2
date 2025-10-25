#!/usr/bin/env node

/**
 * Query production Supabase database schema
 * Usage: node scripts/query-schema.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function querySchema() {
  console.log('Querying production database schema...\n');

  // Query to get all tables in public schema
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .order('table_name');

  if (tablesError) {
    console.error('Error fetching tables:', tablesError);

    // Try alternative approach using RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      process.exit(1);
    }

    console.log('Tables (via RPC):', rpcData);
    return;
  }

  console.log('=== ALL TABLES IN PUBLIC SCHEMA ===');
  console.log(JSON.stringify(tables, null, 2));
  console.log(`\nTotal tables: ${tables?.length || 0}`);
}

querySchema().catch(console.error);