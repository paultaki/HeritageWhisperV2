#!/usr/bin/env node

/**
 * Test production API endpoints
 */

const PROD_URL = 'https://www.joblessbyai.com';
const LOCAL_URL = 'http://localhost:3001';

async function testEndpoint(url, name) {
  console.log(`\nTesting ${name} at ${url}`);

  // Test if the API is reachable
  try {
    const response = await fetch(`${url}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`  Status: ${response.status}`);
    const text = await response.text();

    try {
      const data = JSON.parse(text);
      console.log(`  Response:`, JSON.stringify(data, null, 2));
    } catch (e) {
      console.log(`  Response (raw):`, text.substring(0, 200));
    }
  } catch (error) {
    console.log(`  ❌ Error:`, error.message);
  }
}

async function testRegistration(url, name) {
  console.log(`\n📝 Testing registration at ${name}`);

  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'SuperSecure$Pass$2024';

  try {
    const response = await fetch(`${url}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Test User',
        birthYear: '1970'
      })
    });

    console.log(`  Status: ${response.status}`);
    const data = await response.json();

    if (response.ok) {
      console.log(`  ✅ Registration successful`);
      if (data.session) {
        console.log(`  ✅ Session created (user is confirmed)`);
        return { email: testEmail, password: testPassword, token: data.session.access_token };
      } else {
        console.log(`  ⚠️ No session (email confirmation required)`);
      }
    } else {
      console.log(`  ❌ Registration failed:`, data.error);
      if (data.details) console.log(`     Details:`, data.details);
    }
  } catch (error) {
    console.log(`  ❌ Network error:`, error.message);
  }

  return null;
}

async function testLogin(url, name, credentials) {
  console.log(`\n🔑 Testing login at ${name}`);

  try {
    const response = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });

    console.log(`  Status: ${response.status}`);
    const data = await response.json();

    if (response.ok && data.session) {
      console.log(`  ✅ Login successful`);
      return data.session.access_token;
    } else {
      console.log(`  ❌ Login failed:`, data.error);
      if (data.error === 'Email not confirmed') {
        console.log(`  ⚠️ EMAIL CONFIRMATION STILL REQUIRED`);
      }
    }
  } catch (error) {
    console.log(`  ❌ Network error:`, error.message);
  }

  return null;
}

async function compareEnvironments() {
  console.log('🔍 Comparing Local vs Production\n');
  console.log('=' .repeat(50));

  // Test basic connectivity
  await testEndpoint(LOCAL_URL, 'LOCAL');
  await testEndpoint(PROD_URL, 'PRODUCTION');

  console.log('\n' + '=' .repeat(50));

  // Test registration on production
  const prodCreds = await testRegistration(PROD_URL, 'PRODUCTION');

  if (prodCreds) {
    // Try to login with the new user
    await testLogin(PROD_URL, 'PRODUCTION', prodCreds);
  }

  console.log('\n' + '=' .repeat(50));
  console.log('\n📊 Summary:');
  console.log('If production is failing but local works:');
  console.log('1. Check Vercel environment variables');
  console.log('2. Ensure SUPABASE_SERVICE_ROLE_KEY is set in Vercel');
  console.log('3. Check Vercel function logs for detailed errors');
  console.log('4. Verify the deployment includes latest code');
}

compareEnvironments().catch(console.error);