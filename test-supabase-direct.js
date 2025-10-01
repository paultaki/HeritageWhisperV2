#!/usr/bin/env node

/**
 * Direct Supabase Test
 * This script tests Supabase authentication directly
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const supabaseUrl = 'https://tjycibrhoammxohemyhq.supabase.co';
const supabaseAnonKey = 'sb_publishable_RoDKJhPrkmsm8FTKm3ryBA__xJwEDa8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
  console.log('🔍 Testing Supabase directly...\n');

  const TEST_EMAIL = 'test@example.com';
  const TEST_PASSWORD = 'SuperSecure$Password2024!Heritage';

  // Try to sign in
  console.log('Attempting to sign in with Supabase...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (signInError) {
    console.log('❌ Sign in failed:', signInError.message);
    console.log('   Error code:', signInError.code);
    console.log('   Error status:', signInError.status);

    if (signInError.message.includes('not confirmed')) {
      console.log('\n⚠️  User needs email confirmation!');
      console.log('   The user was created but needs to confirm their email.');
      console.log('   Check the email for a confirmation link.');
    }
  } else {
    console.log('✅ Sign in successful!');
    console.log('   User ID:', signInData.user?.id);
    console.log('   Email:', signInData.user?.email);
    console.log('   Session:', signInData.session ? 'Active' : 'None');
  }

  // Try to get the user
  console.log('\nChecking if user exists...');
  const { data: userData, error: userError } = await supabase.auth.admin?.getUserById?.(
    '7979c17d-3d7c-47af-9cdd-a0bbfc2bf378'
  ).catch(err => ({ data: null, error: err }));

  if (userError) {
    console.log('   Cannot check user directly (admin access required)');
  } else if (userData) {
    console.log('   User found:', userData);
  }

  // List auth settings
  console.log('\n📋 Supabase Auth Configuration:');
  console.log('   URL:', supabaseUrl);
  console.log('   Using anon key (public)');

  console.log('\n💡 If login is failing, possible reasons:');
  console.log('   1. Email confirmation required (check Supabase dashboard)');
  console.log('   2. User was created but not confirmed');
  console.log('   3. Password doesn\'t match');
  console.log('   4. Supabase project settings need adjustment');

  console.log('\n🔧 To fix email confirmation issue:');
  console.log('   1. Go to Supabase dashboard > Authentication > Settings');
  console.log('   2. Disable "Enable email confirmations" for testing');
  console.log('   3. Or manually confirm the user in the dashboard');
}

testSupabase().catch(console.error);