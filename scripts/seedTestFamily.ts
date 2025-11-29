#!/usr/bin/env tsx
/**
 * Test Family Seeding Script
 *
 * Creates a realistic test family cluster with:
 * - Owner auth user + public.users record
 * - Stories with various metadata
 * - Follow-up questions
 * - Ghost prompts and user prompts
 * - Active prompts and prompt history
 * - Family members with activity
 *
 * Usage:
 *   pnpm seed:test-family
 *   npx tsx scripts/seedTestFamily.ts
 *
 * Environment:
 *   Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// Load environment variables from .env.local
config({ path: resolve(__dirname, "../.env.local") });

// ============================================================================
// CONFIGURATION
// ============================================================================

const TEST_USER_EMAIL = "test+owner@heritagewhisper.com";
const TEST_USER_PASSWORD = "HWDemo1234!";
const TEST_USER_NAME = "Eleanor Test";
const TEST_USER_BIRTH_YEAR = 1955;

const FAMILY_MEMBER_EMAILS = [
  { email: "test+spouse@heritagewhisper.com", name: "Robert Test", relationship: "Spouse" },
  { email: "test+child@heritagewhisper.com", name: "Sarah Test", relationship: "Daughter" },
];

// ============================================================================
// HELPERS
// ============================================================================

function generateAnchorHash(type: string, entity: string, year: number | null): string {
  const yearStr = year?.toString() || "NA";
  const data = `${type}|${entity}|${yearStr}`;
  // Simple hash for testing - in production this would be SHA1
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

function getLifePhase(birthYear: number, storyYear: number): string {
  const age = storyYear - birthYear;
  if (age < 13) return "childhood";
  if (age < 20) return "teen";
  if (age < 35) return "early_adult";
  if (age < 55) return "mid_adult";
  if (age < 70) return "late_adult";
  return "senior";
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedTestFamily() {
  console.log("\n=== HeritageWhisper Test Family Seeder ===\n");

  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing required environment variables:");
    if (!supabaseUrl) console.error("  - NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseServiceKey) console.error("  - SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  // Create admin client
  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log(`Target: ${supabaseUrl}`);
  console.log(`Test User: ${TEST_USER_EMAIL}\n`);

  try {
    // ========================================================================
    // STEP 1: Create or get auth user
    // ========================================================================
    console.log("1. Creating/finding auth user...");

    let authUserId: string;

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: { email?: string }) => u.email === TEST_USER_EMAIL
    );

    if (existingUser) {
      authUserId = existingUser.id;
      console.log(`   Found existing auth user: ${authUserId}`);
    } else {
      // Create new auth user
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
          email_confirm: true,
          user_metadata: {
            name: TEST_USER_NAME,
          },
        });

      if (createError) {
        throw new Error(`Failed to create auth user: ${createError.message}`);
      }

      authUserId = newUser.user.id;
      console.log(`   Created new auth user: ${authUserId}`);
    }

    // ========================================================================
    // STEP 2: Create or update public.users record
    // ========================================================================
    console.log("2. Creating/updating public.users record...");

    const { data: existingPublicUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", authUserId)
      .single();

    if (existingPublicUser) {
      // Update existing
      const { error: updateError } = await supabase
        .from("users")
        .update({
          email: TEST_USER_EMAIL,
          name: TEST_USER_NAME,
          birth_year: TEST_USER_BIRTH_YEAR,
          is_paid: true,
          subscription_status: "active",
          email_notifications: true,
          weekly_digest: true,
          family_comments: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUserId);

      if (updateError) {
        throw new Error(`Failed to update public.users: ${updateError.message}`);
      }
      console.log(`   Updated existing public.users record`);
    } else {
      // Insert new - use only core columns from initial schema
      const { error: insertError } = await supabase.from("users").insert({
        id: authUserId,
        email: TEST_USER_EMAIL,
        name: TEST_USER_NAME,
        birth_year: TEST_USER_BIRTH_YEAR,
        is_paid: true,
        subscription_status: "active",
        email_notifications: true,
        weekly_digest: true,
        family_comments: true,
        story_count: 0,
        free_stories_used: 0,
        pdf_exports_count: 0,
        data_exports_count: 0,
        ai_processing_enabled: true,
      });

      if (insertError) {
        throw new Error(`Failed to insert public.users: ${insertError.message}`);
      }
      console.log(`   Created new public.users record`);
    }

    // ========================================================================
    // STEP 3: Seed stories
    // ========================================================================
    console.log("3. Seeding stories...");

    const storyData = [
      {
        title: "My First Day at Lincoln Elementary",
        transcription:
          "I still remember walking through those big wooden doors on my first day of school in 1961. My mother had made me a special dress with little blue flowers. I was so nervous, but Miss Patterson greeted us with the warmest smile. She had this way of making every child feel special.",
        duration_seconds: 180,
        year: 1961,
        life_phase: getLifePhase(TEST_USER_BIRTH_YEAR, 1961),
        include_in_book: true,
        include_in_timeline: true,
        is_favorite: true,
        emotions: ["nostalgia", "joy", "nervousness"],
        lesson_learned: "First impressions shape how we approach new experiences throughout life.",
      },
      {
        title: "Summer at Grandpa's Farm",
        transcription:
          "Every summer from 1960 to 1968, we'd spend two glorious weeks at Grandpa's farm in Iowa. The smell of fresh hay, the sound of roosters at dawn, learning to milk cows... Those were the days that taught me about hard work and the simple pleasures of life.",
        duration_seconds: 240,
        year: 1965,
        life_phase: getLifePhase(TEST_USER_BIRTH_YEAR, 1965),
        include_in_book: true,
        include_in_timeline: true,
        is_favorite: false,
        emotions: ["joy", "peace", "nostalgia"],
        lesson_learned: "The best memories are often made in the simplest moments.",
      },
      {
        title: "Meeting Robert at the Dance",
        transcription:
          "It was the spring dance of 1973. I was wearing my favorite blue dress - the one Mom made for my graduation. Robert walked across the room, and I swear my heart stopped. He asked me to dance, and forty-five years later, we're still dancing.",
        duration_seconds: 150,
        year: 1973,
        life_phase: getLifePhase(TEST_USER_BIRTH_YEAR, 1973),
        include_in_book: true,
        include_in_timeline: true,
        is_favorite: true,
        emotions: ["love", "excitement", "nervousness"],
        lesson_learned: "Sometimes the most important moments in life begin with a simple hello.",
      },
      {
        title: "The Day Sarah Was Born",
        transcription:
          "November 15th, 1980. The longest and most wonderful day of my life. After eighteen hours of labor, I held my daughter for the first time. She had her father's eyes and the tiniest fingers I'd ever seen. In that moment, I understood what my mother meant when she said a piece of your heart lives outside your body forever.",
        duration_seconds: 200,
        year: 1980,
        life_phase: getLifePhase(TEST_USER_BIRTH_YEAR, 1980),
        include_in_book: true,
        include_in_timeline: true,
        is_favorite: true,
        emotions: ["love", "joy", "wonder", "exhaustion"],
        lesson_learned: "Becoming a parent is the beginning of understanding unconditional love.",
      },
      {
        title: "Learning to Garden from Mom",
        transcription:
          "Mom had the most beautiful rose garden in the whole neighborhood. Every spring, she'd show me how to prune, when to fertilize, how to talk to the plants. I thought she was crazy at first, but now I do the same thing. Some of her roses still bloom in my garden today.",
        duration_seconds: 165,
        year: 1968,
        life_phase: getLifePhase(TEST_USER_BIRTH_YEAR, 1968),
        include_in_book: true,
        include_in_timeline: true,
        is_favorite: false,
        emotions: ["nostalgia", "gratitude", "peace"],
        lesson_learned: "The traditions we pass down are the threads that connect generations.",
      },
    ];

    const insertedStories: { id: string; title: string; year: number }[] = [];

    for (const story of storyData) {
      const storyId = randomUUID();
      const { error: storyError } = await supabase.from("stories").insert({
        id: storyId,
        user_id: authUserId,
        title: story.title,
        transcription: story.transcription, // Column name from migration
        duration_seconds: story.duration_seconds,
        story_year: story.year, // Column name from migration (was 'year' in schema)
        life_phase: story.life_phase,
        include_in_book: story.include_in_book,
        include_in_timeline: story.include_in_timeline,
        is_favorite: story.is_favorite,
        emotions: story.emotions,
        lesson_learned: story.lesson_learned,
        recording_mode: "audio",
      });

      if (storyError) {
        console.error(`   Failed to insert story "${story.title}": ${storyError.message}`);
      } else {
        insertedStories.push({ id: storyId, title: story.title, year: story.year });
      }
    }
    console.log(`   Created ${insertedStories.length} stories`);

    // ========================================================================
    // STEP 4: Seed follow-ups for stories
    // ========================================================================
    console.log("4. Seeding follow-up questions...");

    let followUpCount = 0;
    for (const story of insertedStories.slice(0, 3)) {
      const followUps = [
        {
          story_id: story.id,
          question_text: "What else do you remember about that day?",
          question_type: "detail",
          was_answered: false,
        },
        {
          story_id: story.id,
          question_text: "How did this experience change you?",
          question_type: "reflection",
          was_answered: false,
        },
      ];

      const { error: followUpError } = await supabase.from("follow_ups").insert(followUps);
      if (!followUpError) {
        followUpCount += followUps.length;
      }
    }
    console.log(`   Created ${followUpCount} follow-up questions`);

    // ========================================================================
    // STEP 5: Seed ghost prompts
    // ========================================================================
    console.log("5. Seeding ghost prompts...");

    const ghostPrompts = [
      {
        user_id: authUserId,
        prompt_text: "Tell me about your favorite holiday tradition growing up.",
        prompt_title: "Holiday Traditions",
        category: "family",
        decade: "1960s",
        age_range: "Ages 5-15",
        is_generated: false,
      },
      {
        user_id: authUserId,
        prompt_text: "What was your first job and what did you learn from it?",
        prompt_title: "First Job Experience",
        category: "career",
        decade: "1970s",
        age_range: "Ages 15-25",
        is_generated: false,
      },
      {
        user_id: authUserId,
        prompt_text: "Describe a meal that brings back strong memories.",
        prompt_title: "Food Memories",
        category: "sensory",
        decade: "1960s",
        age_range: "Ages 5-15",
        is_generated: true,
        based_on_story_id: insertedStories[1]?.id || null,
      },
    ];

    const { error: ghostError, data: insertedGhostPrompts } = await supabase
      .from("ghost_prompts")
      .insert(ghostPrompts)
      .select("id");

    console.log(`   Created ${insertedGhostPrompts?.length || 0} ghost prompts`);

    // ========================================================================
    // STEP 6: Seed user prompts (catalog)
    // ========================================================================
    console.log("6. Seeding user prompts (catalog)...");

    // user_prompts status (after migration 0014): 'ready', 'queued', 'dismissed', 'recorded', 'deleted'
    // ('saved' was migrated to 'dismissed')
    const userPrompts = [
      {
        user_id: authUserId,
        text: "What was the best advice your parents ever gave you?",
        category: "wisdom",
        source: "catalog",
        status: "dismissed", // In Archive section
      },
      {
        user_id: authUserId,
        text: "Describe your childhood bedroom in detail.",
        category: "childhood",
        source: "catalog",
        status: "queued", // In Queue section
        queue_position: 1,
      },
      {
        user_id: authUserId,
        text: "What was your favorite thing to do on a rainy day?",
        category: "childhood",
        source: "catalog",
        status: "queued",
        queue_position: 2,
      },
    ];

    const { error: userPromptError, data: insertedUserPrompts } = await supabase
      .from("user_prompts")
      .insert(userPrompts)
      .select("id");

    if (userPromptError) {
      console.error(`   Failed to insert user prompts: ${userPromptError.message}`);
    }
    console.log(`   Created ${insertedUserPrompts?.length || 0} user prompts`);

    // ========================================================================
    // STEP 7: Seed active prompts
    // ========================================================================
    console.log("7. Seeding active prompts...");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days

    const activePrompts = [
      {
        user_id: authUserId,
        prompt_text: "You mentioned Grandpa's farm in Iowa. What was your favorite thing to do there?",
        context_note: "Based on your 1965 story about summer at the farm",
        anchor_entity: "Grandpa's farm",
        anchor_year: 1965,
        anchor_hash: generateAnchorHash("location", "Grandpa's farm", 1965),
        tier: 1,
        memory_type: "place_expansion",
        prompt_score: 85,
        score_reason: "Strong emotional connection to childhood memories",
        model_version: "gpt-4o",
        expires_at: expiresAt.toISOString(),
        is_locked: false,
        shown_count: 0,
        user_status: "available",
      },
      {
        user_id: authUserId,
        prompt_text: "Tell me more about Miss Patterson. What made her special?",
        context_note: "Based on your first day of school story",
        anchor_entity: "Miss Patterson",
        anchor_year: 1961,
        anchor_hash: generateAnchorHash("person", "Miss Patterson", 1961),
        tier: 1,
        memory_type: "person_expansion",
        prompt_score: 78,
        score_reason: "Teacher figure with emotional significance",
        model_version: "gpt-4o",
        expires_at: expiresAt.toISOString(),
        is_locked: false,
        shown_count: 2,
        user_status: "available",
      },
    ];

    const { error: activeError, data: insertedActivePrompts } = await supabase
      .from("active_prompts")
      .insert(activePrompts)
      .select("id");

    console.log(`   Created ${insertedActivePrompts?.length || 0} active prompts`);

    // ========================================================================
    // STEP 8: Seed prompt history
    // ========================================================================
    console.log("8. Seeding prompt history...");

    const promptHistory = [
      {
        user_id: authUserId,
        prompt_text: "What games did you play as a child?",
        anchor_hash: generateAnchorHash("activity", "childhood games", null),
        anchor_entity: "childhood games",
        tier: 0,
        memory_type: "general",
        prompt_score: 65,
        shown_count: 3,
        outcome: "used",
        story_id: insertedStories[0]?.id || null,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      },
      {
        user_id: authUserId,
        prompt_text: "Describe your wedding day.",
        anchor_hash: generateAnchorHash("event", "wedding", 1974),
        anchor_entity: "wedding",
        anchor_year: 1974,
        tier: 2,
        memory_type: "milestone",
        prompt_score: 90,
        shown_count: 1,
        outcome: "skipped",
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      },
    ];

    const { error: historyError, data: insertedHistory } = await supabase
      .from("prompt_history")
      .insert(promptHistory)
      .select("id");

    console.log(`   Created ${insertedHistory?.length || 0} prompt history records`);

    // ========================================================================
    // STEP 9: Seed family members
    // ========================================================================
    console.log("9. Seeding family members...");

    const familyMemberRecords: { id: string; email: string; name: string }[] = [];

    for (const member of FAMILY_MEMBER_EMAILS) {
      const memberId = randomUUID();
      // Use only columns from the initial schema (0000_initial_schema.sql)
      const { error: memberError } = await supabase.from("family_members").insert({
        id: memberId,
        user_id: authUserId,
        email: member.email,
        name: member.name,
        relationship: member.relationship,
        status: "active",
        custom_message: `Welcome to the family, ${member.name}!`,
        permissions: { canView: true, canComment: true, canDownload: false },
      });

      if (!memberError) {
        familyMemberRecords.push({ id: memberId, email: member.email, name: member.name });
      } else {
        console.error(`   Failed to create family member ${member.email}: ${memberError.message}`);
      }
    }
    console.log(`   Created ${familyMemberRecords.length} family members`);

    // ========================================================================
    // STEP 10: Seed family activity
    // ========================================================================
    console.log("10. Seeding family activity...");

    let activityCount = 0;
    for (const member of familyMemberRecords) {
      // Each family member has viewed some stories
      for (let i = 0; i < Math.min(2, insertedStories.length); i++) {
        const { error: activityError } = await supabase.from("family_activity").insert({
          user_id: authUserId,
          family_member_id: member.id,
          story_id: insertedStories[i].id,
          activity_type: "viewed",
          details: `${member.name} listened to "${insertedStories[i].title}"`,
        });
        if (!activityError) activityCount++;
      }

      // One family member favorited a story
      if (member.name === "Sarah Test" && insertedStories.length > 0) {
        const { error: favError } = await supabase.from("family_activity").insert({
          user_id: authUserId,
          family_member_id: member.id,
          story_id: insertedStories[0].id,
          activity_type: "favorited",
          details: `${member.name} marked "${insertedStories[0].title}" as a favorite`,
        });
        if (!favError) activityCount++;
      }
    }
    console.log(`   Created ${activityCount} family activity records`);

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log("\n" + "=".repeat(50));
    console.log("SEED COMPLETE");
    console.log("=".repeat(50));
    console.log(`
User ID:           ${authUserId}
Email:             ${TEST_USER_EMAIL}
Password:          ${TEST_USER_PASSWORD}

Stories:           ${insertedStories.length}
Follow-ups:        ${followUpCount}
Ghost prompts:     ${insertedGhostPrompts?.length || 0}
User prompts:      ${insertedUserPrompts?.length || 0}
Active prompts:    ${insertedActivePrompts?.length || 0}
Prompt history:    ${insertedHistory?.length || 0}
Family members:    ${familyMemberRecords.length}
Family activity:   ${activityCount}
`);
    console.log("You can now log in with:");
    console.log(`  Email: ${TEST_USER_EMAIL}`);
    console.log(`  Password: ${TEST_USER_PASSWORD}\n`);

  } catch (error) {
    console.error("\n SEED FAILED:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the seeder
seedTestFamily();
