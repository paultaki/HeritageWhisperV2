#!/usr/bin/env node

/**
 * Complete test flow: Register, Login, Save Story
 */

const API_BASE = 'http://localhost:3001';

// Generate unique test credentials
const timestamp = Date.now();
const TEST_EMAIL = `test${timestamp}@example.com`;
const TEST_PASSWORD = 'SecurePassword123!';
const TEST_NAME = 'Test User ' + timestamp;

async function registerUser() {
  console.log('📝 Registering new user...');
  console.log('   Email:', TEST_EMAIL);
  console.log('   Password:', TEST_PASSWORD);

  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME,
        birthYear: '1970'
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Registration successful!');
      if (data.session) {
        console.log('   ✅ User is auto-confirmed!');
        return data.session.access_token;
      } else {
        console.log('   ⚠️ No session returned - email confirmation may be required');
        return null;
      }
    } else {
      console.log('❌ Registration failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    return null;
  }
}

async function loginUser() {
  console.log('\n🔑 Attempting to login...');

  // Wait a bit for database to sync
  await new Promise(resolve => setTimeout(resolve, 1000));

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
      return data.session.access_token;
    } else {
      console.log('❌ Login failed:', data.error);
      if (data.error === 'Email not confirmed') {
        console.log('\n⚠️ EMAIL CONFIRMATION ISSUE DETECTED');
        console.log('Please run FIX_EMAIL_CONFIRMATION.sql in Supabase SQL Editor');
      }
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return null;
  }
}

async function testSaveStory(token) {
  console.log('\n📝 Testing story save...');

  const storyData = {
    title: "My First Memory",
    content: "I remember the day I learned to ride a bicycle. It was a sunny afternoon in 1975, and my father was running behind me, holding the seat. I didn't know he had let go until I looked back and saw him standing far behind, smiling and waving. That moment of realization - that I was doing it on my own - filled me with such pride and joy.",
    transcription: "I remember the day I learned to ride a bicycle. It was a sunny afternoon in 1975...",
    year: 1975,
    storyYear: 1975,
    age: 5,
    includeInTimeline: true,
    includeInBook: true,
    isFavorite: true,
    hasPhotos: false,
    photos: [],
    audioUrl: null,
    durationSeconds: 45
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
      if (data.details) {
        console.log('   Details:', data.details);
      }
      return null;
    }
  } catch (error) {
    console.error('❌ Story save error:', error.message);
    return null;
  }
}

async function testFetchStories(token) {
  console.log('\n📚 Fetching user stories...');

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

async function runCompleteTest() {
  console.log('🧪 Complete Test Flow for HeritageWhisperV2\n');
  console.log('=' .repeat(50));

  // Step 1: Register new user
  let token = await registerUser();

  // Step 2: If registration didn't return session, try login
  if (!token) {
    token = await loginUser();
  }

  if (!token) {
    console.log('\n' + '='.repeat(50));
    console.log('❌ AUTHENTICATION ISSUE DETECTED\n');
    console.log('To fix this:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the contents of FIX_EMAIL_CONFIRMATION.sql');
    console.log('4. Try this test again');
    return;
  }

  // Step 3: Save a story
  const story = await testSaveStory(token);

  // Step 4: Fetch stories
  await testFetchStories(token);

  // Summary
  console.log('\n' + '='.repeat(50));
  if (story) {
    console.log('🎉 SUCCESS! All systems operational!');
    console.log('\nYou can now:');
    console.log('1. Record and save stories');
    console.log('2. View them in the timeline');
    console.log('3. Deploy to production');
  } else {
    console.log('⚠️ Story saving needs attention');
    console.log('\nPossible issues:');
    console.log('1. Stories table missing columns');
    console.log('2. Run FIX_STORIES_TABLE.sql in Supabase');
  }
}

// Run the test
runCompleteTest().catch(console.error);