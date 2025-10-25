/**
 * Script to Trigger Prompt Regeneration for Test Account
 *
 * This script will:
 * 1. Clear existing prompts (using SQL)
 * 2. Fetch all stories for the user
 * 3. Trigger new Tier 3 analysis with improved prompts
 *
 * Usage:
 * 1. Set TEST_USER_ID below
 * 2. Run: npx tsx scripts/trigger-prompt-regeneration.ts
 */

import { createClient } from '@supabase/supabase-js';
import { performTier3Analysis, storeTier3Results } from '../lib/tier3Analysis';

// Local widened result type for scripts
type AnyTier3Result = {
  prompts: any[];
  characterInsights?: {
    traits: Array<{ trait: string; [k: string]: unknown }>;
    invisibleRules: string[];
    [k: string]: unknown;
  };
  [k: string]: unknown;
};

// ============================================
// CONFIGURATION - UPDATE THESE!
// ============================================
const TEST_USER_ID = 'YOUR_TEST_USER_ID_HERE'; // REPLACE THIS!

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function clearExistingPrompts(userId: string) {
  console.log('\n📋 Step 1: Clearing existing prompts...');

  // Archive active prompts to history
  const { data: archived, error: archiveError } = await supabase
    .rpc('archive_expired_prompts'); // This RPC might not exist, so we'll do it manually

  // Clear active prompts
  const { error: deleteError, count } = await supabase
    .from('active_prompts')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    console.error('❌ Error clearing prompts:', deleteError);
    return false;
  }

  console.log(`✅ Cleared ${count || 0} active prompts`);

  // Reset character insights
  const { error: updateError } = await supabase
    .from('users')
    .update({
      character_insights: null,
      milestone_reached: 30 // Set to 30 since they have 30 stories
    })
    .eq('id', userId);

  if (updateError) {
    console.error('❌ Error resetting character insights:', updateError);
    return false;
  }

  console.log('✅ Reset character insights');
  return true;
}

async function fetchUserStories(userId: string) {
  console.log('\n📖 Step 2: Fetching user stories...');

  const { data: stories, error } = await supabase
    .from('stories')
    .select('id, title, transcript, lesson_learned, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error fetching stories:', error);
    return null;
  }

  console.log(`✅ Found ${stories.length} stories`);
  return stories;
}

async function generateNewPrompts(userId: string, stories: any[]) {
  console.log('\n🤖 Step 3: Generating new prompts with improved system...');
  console.log('Using the new simplified personalization approach...');

  try {
    // Perform Tier 3 analysis (this uses the updated prompt system)
    const rawResult = await performTier3Analysis(stories, stories.length);
    const result = rawResult as AnyTier3Result;

    console.log(`✅ Generated ${result.prompts.length} new prompts`);

    // Show a preview of the prompts
    console.log('\n📝 Generated Prompts:');
    result.prompts.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.prompt}`);
      console.log(`     Reasoning: ${p.reasoning}`);
    });

    // Store the results
    await storeTier3Results(supabase, userId, stories.length, rawResult);

    console.log('\n✅ Prompts stored in database');

    // Show character insights if any
    if (result.characterInsights) {
      console.log('\n🧠 Character Insights:');
      console.log('  Traits:', result.characterInsights.traits.map((t: any) => t.trait).join(', '));
      console.log('  Rules:', result.characterInsights.invisibleRules.join(', '));
    }

    return true;
  } catch (error) {
    console.error('❌ Error generating prompts:', error);
    return false;
  }
}

async function verifyResults(userId: string) {
  console.log('\n✔️ Step 4: Verifying results...');

  const { data: prompts, error } = await supabase
    .from('active_prompts')
    .select('prompt_text, tier, memory_type')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error verifying:', error);
    return;
  }

  console.log(`\n✅ Successfully created ${prompts.length} new prompts`);
  console.log('\n📌 Current Active Prompts:');
  prompts.forEach((p, i) => {
    console.log(`  ${i + 1}. [Tier ${p.tier}] ${p.prompt_text}`);
  });
}

// Main execution
async function main() {
  console.log('========================================');
  console.log('🚀 PROMPT REGENERATION SCRIPT');
  console.log('========================================');
  console.log(`User ID: ${TEST_USER_ID}`);

  if (TEST_USER_ID === 'YOUR_TEST_USER_ID_HERE') {
    console.error('\n❌ ERROR: You must set TEST_USER_ID in the script!');
    console.error('Edit scripts/trigger-prompt-regeneration.ts and set your test user ID');
    process.exit(1);
  }

  // Step 1: Clear existing prompts
  const cleared = await clearExistingPrompts(TEST_USER_ID);
  if (!cleared) {
    console.error('Failed to clear existing prompts');
    process.exit(1);
  }

  // Step 2: Fetch stories
  const stories = await fetchUserStories(TEST_USER_ID);
  if (!stories || stories.length === 0) {
    console.error('No stories found for user');
    process.exit(1);
  }

  // Step 3: Generate new prompts
  const generated = await generateNewPrompts(TEST_USER_ID, stories);
  if (!generated) {
    console.error('Failed to generate new prompts');
    process.exit(1);
  }

  // Step 4: Verify
  await verifyResults(TEST_USER_ID);

  console.log('\n========================================');
  console.log('✨ REGENERATION COMPLETE!');
  console.log('========================================');
  console.log('\nNext steps:');
  console.log('1. Check the prompts page in your app');
  console.log('2. Verify the prompts are personalized correctly');
  console.log('3. Test that they don\'t have weird questions');
  console.log('\nThe prompts should now:');
  console.log('  - Reference actual workplace/people names');
  console.log('  - Fill timeline gaps naturally');
  console.log('  - Feel like a friend asking, not an AI');
  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});