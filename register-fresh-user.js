#!/usr/bin/env node

/**
 * Register a fresh user after setting up auto-confirm trigger
 */

const TEST_EMAIL = 'freshtest@example.com';
const TEST_PASSWORD = 'TestPassword2024!';
const TEST_NAME = 'Fresh Test User';
const TEST_BIRTH_YEAR = '1960';

const API_BASE = 'http://localhost:3001';

async function registerAndTest() {
  console.log('🆕 Registering fresh user (should be auto-confirmed)\n');
  console.log(`Email: ${TEST_EMAIL}`);
  console.log(`Password: ${TEST_PASSWORD}\n`);

  // Step 1: Register
  console.log('📝 Registering user...');
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
      if (registerData.session) {
        console.log('   ✅ Session created - user is confirmed!');
      }
    } else {
      console.log('❌ Registration failed:', registerData.error);
      return;
    }
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    return;
  }

  // Wait a moment
  console.log('\n⏳ Waiting 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 2: Try to login
  console.log('\n🔑 Testing login...');
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
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log('   User:', loginData.user?.name);
      console.log('   Session:', loginData.session ? 'Active' : 'None');
      console.log('\n🎉 AUTHENTICATION IS NOW WORKING!');
      console.log('\n📝 You can now log in via the browser with:');
      console.log(`   Email: ${TEST_EMAIL}`);
      console.log(`   Password: ${TEST_PASSWORD}`);
      console.log('\n   URL: http://localhost:3001/auth/login');
    } else {
      console.log('❌ Login failed:', loginData.error);
      console.log('\n💡 If you see "Email not confirmed":');
      console.log('   The auto-confirm trigger might not be set up');
      console.log('   Run the SQL queries from FIX_AUTH_COMPLETE.sql first');
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
  }
}

registerAndTest().catch(console.error);