/**
 * Test script to manually trigger story notification
 *
 * Usage:
 * 1. Make sure .env.local exists in the project root
 * 2. Update the STORY_ID and USER_ID constants below
 * 3. Run: npx tsx -r dotenv/config scripts/test-notification.ts dotenv_config_path=.env.local
 *    OR: node -r dotenv/config --import tsx/esm scripts/test-notification.ts dotenv_config_path=.env.local
 */

import { sendNewStoryNotifications } from '../lib/notifications/send-new-story-notifications';

// ============================================================================
// CONFIGURATION - Update these values
// ============================================================================
const USER_ID = '38ad3036-e423-4e41-a3f3-020664a1ee0e'; // The storyteller's user ID
const STORY_ID = 'fb9e9e99-fb82-4880-8d02-30c4829168e3'; // The story ID you just created
const STORY_TITLE = 'Test Story Title';
const STORY_YEAR = 2024;
const TRANSCRIPT = 'This is a test story transcript to verify notifications are working.';

// ============================================================================
// TEST EXECUTION
// ============================================================================
async function testNotification() {
  console.log('🧪 Testing story notification system...\n');
  console.log('Configuration:');
  console.log(`  Storyteller ID: ${USER_ID}`);
  console.log(`  Story ID: ${STORY_ID}`);
  console.log(`  Story Title: ${STORY_TITLE}`);
  console.log(`  Transcript: ${TRANSCRIPT.substring(0, 50)}...\n`);

  try {
    await sendNewStoryNotifications({
      storytellerUserId: USER_ID,
      storyId: STORY_ID,
      storyTitle: STORY_TITLE,
      storyYear: STORY_YEAR,
      heroPhotoPath: undefined,
      transcript: TRANSCRIPT,
    });

    console.log('\n✅ Test completed! Check logs above for results.');
    console.log('\nExpected log messages:');
    console.log('  - [StoryNotification] Skipping story emails - no Resend API key configured');
    console.log('  - [StoryNotification] No active family members to notify');
    console.log('  - [StoryNotification] ✅ Email sent to...');
    console.log('  - [StoryNotification] Story notifications complete: X sent, Y failed');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
  }
}

// Run the test
testNotification();
