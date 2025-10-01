#!/usr/bin/env node

/**
 * Test with a completely new user
 */

const TEST_EMAIL = 'testuser' + Date.now() + '@example.com';
const TEST_PASSWORD = 'SuperSecure$Password2024!Heritage';
const TEST_NAME = 'Test User ' + Date.now();
const TEST_BIRTH_YEAR = '1960';

const API_BASE = 'http://localhost:3001';

async function testNewUser() {
  console.log('🆕 Testing with a brand new user\n');
  console.log(`Email: ${TEST_EMAIL}`);
  console.log(`Password: ${TEST_PASSWORD}\n`);

  // Step 1: Register
  console.log('📝 Registering new user...');
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

      // Save the user ID for SQL query
      if (registerData.user?.id) {
        console.log('\n📝 To manually confirm this user, run this SQL in Supabase:');
        console.log(`
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE id = '${registerData.user.id}';
        `);
      }

      if (registerData.session) {
        console.log('✅ Session created - user is auto-confirmed!');
        console.log('   You can log in immediately.');
      } else if (registerData.requiresEmailConfirmation) {
        console.log('⚠️  Email confirmation required');
      }
    } else {
      console.log('❌ Registration failed:', registerData.error);
      return;
    }
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    return;
  }

  // Wait a moment for Supabase to process
  console.log('\n⏳ Waiting 2 seconds for Supabase to process...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 2: Try to login
  console.log('\n🔑 Attempting to login...');
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
      console.log('\n🎉 Authentication is working!');
      console.log(`   Email: ${TEST_EMAIL}`);
      console.log(`   Password: ${TEST_PASSWORD}`);
    } else {
      console.log('❌ Login failed:', loginData.error);

      if (loginData.error === 'Invalid credentials' && loginData.error !== 'Email not confirmed') {
        console.log('   This might mean the email IS confirmed but password is wrong');
        console.log('   Double-check the password matches exactly');
      }
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
  }
}

testNewUser().catch(console.error);