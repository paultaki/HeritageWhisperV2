#!/usr/bin/env node

/**
 * Test story saving on production
 */

const PROD_URL = 'https://www.joblessbyai.com';

async function testStorySave() {
  console.log('Testing story save on production...\n');

  // First, we need to authenticate
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'SuperSecure$Pass$2024!';

  // Register
  console.log('1. Registering user...');
  const regResponse = await fetch(`${PROD_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: 'Test User',
      birthYear: '1970'
    })
  });

  const regData = await regResponse.json();

  if (!regResponse.ok || !regData.session) {
    console.error('Registration failed:', regData);
    return;
  }

  const token = regData.session.access_token;
  console.log('✅ Registered and got token\n');

  // Now try to save a story
  console.log('2. Saving story...');
  const storyData = {
    title: 'Test Story',
    audioUrl: null,
    transcription: "The date stamp read June 14th, 1990. This is a test story.",
    formattedContent: null,
    storyYear: 1990,
    year: 1990,
    age: 20,
    includeInTimeline: true,
    includeInBook: true,
    isFavorite: false,
    hasPhotos: false,
    photos: [],
    durationSeconds: 60
  };

  const saveResponse = await fetch(`${PROD_URL}/api/stories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(storyData)
  });

  const saveResult = await saveResponse.json();

  if (saveResponse.ok) {
    console.log('✅ Story saved successfully!');
    console.log('Story ID:', saveResult.story?.id);
  } else {
    console.error('❌ Story save failed:', saveResult.error);
    console.error('Details:', saveResult.details);
  }
}

testStorySave().catch(console.error);