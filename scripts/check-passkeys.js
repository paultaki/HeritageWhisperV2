#!/usr/bin/env node

/**
 * Check passkeys for a user
 * Usage: node scripts/check-passkeys.js
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkPasskeys() {
  const email = 'demo@heritagewhisper.com';

  // First get the user ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', email)
    .single();

  if (userError) {
    console.log('User lookup error:', userError);
    return;
  }

  console.log('User found:', user);

  // Now check for passkeys
  const { data: passkeys, error: passkeysError } = await supabase
    .from('passkeys')
    .select('*')
    .eq('user_id', user.id);

  if (passkeysError) {
    console.log('Passkeys error:', passkeysError);
    return;
  }

  console.log('\nPasskeys found:', passkeys?.length || 0);
  if (passkeys && passkeys.length > 0) {
    passkeys.forEach((p, i) => {
      console.log(`\nPasskey ${i+1}:`);
      console.log('  ID:', p.id);
      console.log('  Credential ID:', p.credential_id);
      console.log('  Credential ID length:', p.credential_id?.length);
      console.log('  Friendly name:', p.friendly_name);
      console.log('  Created at:', p.created_at);
      console.log('  Last used:', p.last_used_at);
    });
  } else {
    console.log('No passkeys registered for this user!');
  }
}

checkPasskeys().catch(console.error);
