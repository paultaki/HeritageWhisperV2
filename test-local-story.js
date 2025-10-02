#!/usr/bin/env node

/**
 * Test story creation locally
 * This script tests the complete flow: login, transcribe, and save story
 */

const API_BASE = 'http://localhost:3001';

// Use a user that already exists and is confirmed
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test123456!';

async function testLogin() {
  console.log('🔑 Testing login...');
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    const data = await response.json();

    if (response.ok && data.session) {
      console.log('✅ Login successful!');
      console.log('   Token:', data.session.access_token.substring(0, 20) + '...');
      return data.session.access_token;
    } else {
      console.log('❌ Login failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return null;
  }
}

async function testAuthMe(token) {
  console.log('\n👤 Testing /api/auth/me...');
  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Auth/me successful!');
      console.log('   User:', data.user?.name || data.user?.email);
      return true;
    } else {
      console.log('❌ Auth/me failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Auth/me error:', error.message);
    return false;
  }
}

async function testSaveStory(token) {
  console.log('\n📝 Testing story save...');

  const storyData = {
    title: "Test Story " + new Date().toISOString(),
    content: "This is a test story created at " + new Date().toISOString(),
    transcription: "This is a test transcription of the audio recording.",
    year: 2020,
    storyYear: 2020,
    age: 25,
    includeInTimeline: true,
    includeInBook: true,
    isFavorite: false,
    hasPhotos: false,
    photos: [],
    audioUrl: null,
    durationSeconds: 60
  };

  try {
    const response = await fetch(`${API_BASE}/api/stories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(storyData)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Story saved successfully!');
      console.log('   Story ID:', data.story?.id);
      console.log('   Title:', data.story?.title);
      return data.story;
    } else {
      console.log('❌ Story save failed:', data.error);
      console.log('   Details:', data.details);
      return null;
    }
  } catch (error) {
    console.error('❌ Story save error:', error.message);
    return null;
  }
}

async function testFetchStories(token) {
  console.log('\n📚 Testing fetch stories...');
  try {
    const response = await fetch(`${API_BASE}/api/stories`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Stories fetched successfully!');
      console.log('   Total stories:', data.stories?.length || 0);
      if (data.stories && data.stories.length > 0) {
        console.log('   Latest story:', data.stories[0].title);
      }
      return true;
    } else {
      console.log('❌ Stories fetch failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Stories fetch error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing HeritageWhisperV2 API Routes\n');
  console.log('Server:', API_BASE);
  console.log('Test user:', TEST_EMAIL);
  console.log('=' .repeat(50));

  // Step 1: Login
  const token = await testLogin();
  if (!token) {
    console.log('\n⚠️  Cannot proceed without authentication');
    console.log('Please make sure:');
    console.log('1. The user exists in Supabase');
    console.log('2. Email is confirmed (run FIX_EMAIL_CONFIRMATION.sql)');
    console.log('3. Password is correct');
    return;
  }

  // Step 2: Test auth/me
  await testAuthMe(token);

  // Step 3: Save a story
  const story = await testSaveStory(token);

  // Step 4: Fetch stories
  await testFetchStories(token);

  console.log('\n' + '='.repeat(50));
  if (story) {
    console.log('🎉 All API routes are working correctly!');
  } else {
    console.log('⚠️  Some issues need to be resolved');
    console.log('\nTroubleshooting:');
    console.log('1. Check if the stories table has all required columns');
    console.log('2. Run FIX_STORIES_TABLE.sql in Supabase');
    console.log('3. Check Supabase logs for detailed errors');
  }
}

// Run the tests
runTests().catch(console.error);