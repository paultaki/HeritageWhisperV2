#!/usr/bin/env node

/**
 * Test Authentication Script
 * This script helps test the authentication flow by creating a test user and logging in
 */

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'SuperSecure$Password2024!Heritage';
const TEST_NAME = 'Test User';
const TEST_BIRTH_YEAR = '1960';

const API_BASE = 'http://localhost:3001';

async function testAuth() {
  console.log('🧪 Testing HeritageWhisperV2 Authentication\n');

  // Step 1: Try to register a new user
  console.log('📝 Step 1: Attempting to register new user...');
  console.log(`   Email: ${TEST_EMAIL}`);
  console.log(`   Name: ${TEST_NAME}`);

  try {
    const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME,
        birthYear: TEST_BIRTH_YEAR
      })
    });

    const registerData = await registerResponse.json();

    if (registerResponse.ok) {
      console.log('✅ Registration successful!');
      console.log('   User ID:', registerData.user?.id);
      if (registerData.requiresEmailConfirmation) {
        console.log('⚠️  Email confirmation required - check your email');
      }
    } else {
      console.log('❌ Registration failed:', registerData.error);
      if (registerData.error?.includes('already registered')) {
        console.log('   User already exists, will try to login...');
      }
    }
  } catch (error) {
    console.error('❌ Registration error:', error.message);
  }

  console.log('\n');

  // Step 2: Try to login
  console.log('🔑 Step 2: Attempting to login...');

  try {
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    const loginData = await loginResponse.json();

    if (loginResponse.ok) {
      console.log('✅ Login successful!');
      console.log('   User:', loginData.user?.name);
      console.log('   Session:', loginData.session ? 'Active' : 'None');
      console.log('\n📌 You can now use these credentials in the browser:');
      console.log(`   Email: ${TEST_EMAIL}`);
      console.log(`   Password: ${TEST_PASSWORD}`);
    } else {
      console.log('❌ Login failed:', loginData.error);
      console.log('\n💡 Troubleshooting tips:');
      console.log('   1. Make sure the dev server is running on port 3001');
      console.log('   2. Check that Supabase environment variables are set in .env.local');
      console.log('   3. Verify Supabase project is active and accessible');
      console.log('   4. If user doesn\'t exist, registration might have failed');
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
  }

  console.log('\n');
  console.log('🔍 Testing /api/auth/me endpoint (without auth)...');

  try {
    const meResponse = await fetch(`${API_BASE}/api/auth/me`);
    const meData = await meResponse.json();

    if (meResponse.ok) {
      console.log('✅ /api/auth/me response:', meData);
    } else {
      console.log('❌ /api/auth/me error (expected without auth):', meData.error);
    }
  } catch (error) {
    console.error('❌ /api/auth/me error:', error.message);
  }
}

// Run the test
testAuth().catch(console.error);