#!/usr/bin/env tsx
/**
 * Test Family Reset Script
 *
 * Resets (deletes) all data for a test family cluster, allowing
 * for easy re-seeding.
 *
 * Usage:
 *   pnpm reset:test-family
 *   npx tsx scripts/resetTestFamily.ts
 *   npx tsx scripts/resetTestFamily.ts --email=custom+test@example.com
 *   npx tsx scripts/resetTestFamily.ts --delete-user
 *
 * Options:
 *   --email=<email>   Reset data for a specific user (default: test+owner@heritagewhisper.com)
 *   --delete-user     Also delete the auth and public.users records (hard reset)
 *
 * Environment:
 *   Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Load environment variables from .env.local
config({ path: resolve(__dirname, "../.env.local") });

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_EMAIL = "test+owner@heritagewhisper.com";

interface Args {
  email: string;
  deleteUser: boolean;
}

function parseArgs(): Args {
  const args: Args = {
    email: DEFAULT_EMAIL,
    deleteUser: false,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--email=")) {
      args.email = arg.split("=")[1];
    } else if (arg === "--delete-user") {
      args.deleteUser = true;
    }
  }

  return args;
}

// ============================================================================
// DELETION HELPERS
// ============================================================================

interface DeletionResult {
  table: string;
  count: number;
  error?: string;
}

async function deleteFromTable(
  supabase: SupabaseClient,
  table: string,
  column: string,
  value: string
): Promise<DeletionResult> {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .eq(column, value);

  if (error) {
    // Ignore "table not found" errors - these are optional tables
    if (error.message.includes("schema cache") || error.message.includes("not found")) {
      return { table, count: 0 }; // Silently skip non-existent tables
    }
    return { table, count: 0, error: error.message };
  }

  return { table, count: count || 0 };
}

async function deleteFromTableWithFK(
  supabase: SupabaseClient,
  table: string,
  fkTable: string,
  fkColumn: string,
  userColumn: string,
  userId: string
): Promise<DeletionResult> {
  // First get the FK IDs belonging to this user
  const { data: fkRecords, error: fkError } = await supabase
    .from(fkTable)
    .select("id")
    .eq(userColumn, userId);

  if (fkError) {
    // Ignore "table not found" errors
    if (fkError.message.includes("schema cache") || fkError.message.includes("not found")) {
      return { table, count: 0 };
    }
    return { table, count: 0, error: `FK lookup failed: ${fkError.message}` };
  }

  if (!fkRecords || fkRecords.length === 0) {
    return { table, count: 0 };
  }

  const fkIds = fkRecords.map((r) => r.id);

  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .in(fkColumn, fkIds);

  if (error) {
    // Ignore "table not found" errors
    if (error.message.includes("schema cache") || error.message.includes("not found")) {
      return { table, count: 0 };
    }
    return { table, count: 0, error: error.message };
  }

  return { table, count: count || 0 };
}

// ============================================================================
// MAIN RESET FUNCTION
// ============================================================================

async function resetTestFamily() {
  console.log("\n=== HeritageWhisper Test Family Reset ===\n");

  const args = parseArgs();
  console.log(`Target email: ${args.email}`);
  console.log(`Delete user: ${args.deleteUser ? "YES" : "NO (soft reset)"}\n`);

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

  try {
    // ========================================================================
    // STEP 1: Find the user
    // ========================================================================
    console.log("1. Finding user...");

    // Find auth user
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users?.find((u: { email?: string }) => u.email === args.email);

    if (!authUser) {
      console.log(`   No auth user found with email: ${args.email}`);
      console.log("   Nothing to reset.\n");
      process.exit(0);
    }

    const userId = authUser.id;
    console.log(`   Found auth user: ${userId}`);

    // Verify public.users exists
    const { data: publicUser } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("id", userId)
      .single();

    if (publicUser) {
      console.log(`   Found public.users: ${publicUser.name} (${publicUser.email})`);
    } else {
      console.log("   Warning: No public.users record found");
    }

    // ========================================================================
    // STEP 2: Delete related data in FK-safe order
    // ========================================================================
    console.log("\n2. Deleting related data...\n");

    const results: DeletionResult[] = [];

    // Tables that reference both family_members AND stories
    // These need special handling - delete via story_id first
    results.push(await deleteFromTableWithFK(
      supabase,
      "family_activity",
      "stories",
      "story_id",
      "user_id",
      userId
    ));

    // Also delete family_activity by family_member_id
    results.push(await deleteFromTableWithFK(
      supabase,
      "family_activity",
      "family_members",
      "family_member_id",
      "user_id",
      userId
    ));

    // activity_events - references users, stories, family_members
    results.push(await deleteFromTable(supabase, "activity_events", "user_id", userId));

    // follow_ups - references stories
    results.push(await deleteFromTableWithFK(
      supabase,
      "follow_ups",
      "stories",
      "story_id",
      "user_id",
      userId
    ));

    // prompt_feedback - references active_prompts and stories
    results.push(await deleteFromTableWithFK(
      supabase,
      "prompt_feedback",
      "stories",
      "story_id",
      "user_id",
      userId
    ));

    // prompt_history - references stories
    results.push(await deleteFromTable(supabase, "prompt_history", "user_id", userId));

    // active_prompts
    results.push(await deleteFromTable(supabase, "active_prompts", "user_id", userId));

    // ghost_prompts - references stories (optional)
    results.push(await deleteFromTable(supabase, "ghost_prompts", "user_id", userId));

    // user_prompts
    results.push(await deleteFromTable(supabase, "user_prompts", "user_id", userId));

    // family_invites - references family_members
    results.push(await deleteFromTableWithFK(
      supabase,
      "family_invites",
      "family_members",
      "family_member_id",
      "user_id",
      userId
    ));

    // family_collaborations - references family_members
    results.push(await deleteFromTableWithFK(
      supabase,
      "family_collaborations",
      "family_members",
      "family_member_id",
      "user_id",
      userId
    ));

    // family_prompts - references family_members
    results.push(await deleteFromTable(supabase, "family_prompts", "storyteller_user_id", userId));

    // family_members
    results.push(await deleteFromTable(supabase, "family_members", "user_id", userId));

    // shared_access
    results.push(await deleteFromTable(supabase, "shared_access", "owner_user_id", userId));

    // treasures - linked_story_id references stories, so delete treasures before stories
    results.push(await deleteFromTable(supabase, "treasures", "user_id", userId));

    // chapters - stories reference chapters, so handle carefully
    // First, unlink stories from chapters
    await supabase
      .from("stories")
      .update({ chapter_id: null })
      .eq("user_id", userId);

    // Then delete chapters
    results.push(await deleteFromTable(supabase, "chapters", "user_id", userId));

    // stories
    results.push(await deleteFromTable(supabase, "stories", "user_id", userId));

    // demo_stories (uses user_id but no FK)
    results.push(await deleteFromTable(supabase, "demo_stories", "user_id", userId));

    // historical_context
    results.push(await deleteFromTable(supabase, "historical_context", "user_id", userId));

    // profiles
    results.push(await deleteFromTable(supabase, "profiles", "user_id", userId));

    // user_agreements
    results.push(await deleteFromTable(supabase, "user_agreements", "user_id", userId));

    // passkeys
    results.push(await deleteFromTable(supabase, "passkeys", "user_id", userId));

    // stripe_customers
    results.push(await deleteFromTable(supabase, "stripe_customers", "user_id", userId));

    // ai_usage_log
    results.push(await deleteFromTable(supabase, "ai_usage_log", "user_id", userId));

    // admin_audit_log (admin actions by this user)
    results.push(await deleteFromTable(supabase, "admin_audit_log", "admin_user_id", userId));

    // Print deletion results
    console.log("   Deletion results:");
    console.log("   " + "-".repeat(45));

    let totalDeleted = 0;
    for (const result of results) {
      if (result.error) {
        console.log(`   ${result.table.padEnd(25)} ERROR: ${result.error}`);
      } else if (result.count > 0) {
        console.log(`   ${result.table.padEnd(25)} ${result.count} deleted`);
        totalDeleted += result.count;
      }
    }
    console.log("   " + "-".repeat(45));
    console.log(`   Total records deleted: ${totalDeleted}`);

    // ========================================================================
    // STEP 3: Optionally delete user records
    // ========================================================================
    if (args.deleteUser) {
      console.log("\n3. Deleting user records (hard reset)...");

      // Delete public.users
      const { error: publicError } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (publicError) {
        console.error(`   Failed to delete public.users: ${publicError.message}`);
      } else {
        console.log("   Deleted public.users record");
      }

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.error(`   Failed to delete auth user: ${authError.message}`);
      } else {
        console.log("   Deleted auth.users record");
      }
    } else {
      console.log("\n3. Keeping user records (soft reset)");
      console.log("   Use --delete-user flag to also remove the user account");

      // Reset user counters
      const { error: resetError } = await supabase
        .from("users")
        .update({
          story_count: 0,
          free_stories_used: 0,
          pdf_exports_count: 0,
          data_exports_count: 0,
          last_pdf_export_at: null,
          last_data_export_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (resetError) {
        console.log(`   Warning: Failed to reset user counters: ${resetError.message}`);
      } else {
        console.log("   Reset user counters to zero");
      }
    }

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log("\n" + "=".repeat(50));
    console.log("RESET COMPLETE");
    console.log("=".repeat(50));

    if (args.deleteUser) {
      console.log(`\nUser ${args.email} has been completely removed.`);
      console.log("Run 'pnpm seed:test-family' to recreate the test user.\n");
    } else {
      console.log(`\nUser ${args.email} data has been cleared (soft reset).`);
      console.log("The user account remains intact.");
      console.log("Run 'pnpm seed:test-family' to repopulate test data.\n");
    }

  } catch (error) {
    console.error("\n RESET FAILED:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the reset
resetTestFamily();
