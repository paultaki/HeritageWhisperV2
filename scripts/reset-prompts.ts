/**
 * Reset prompt system - clear old prompts and start fresh
 */

import { createClient } from "@supabase/supabase-js";
import readline from "readline";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function resetPrompts() {
  console.log("=== PROMPT SYSTEM RESET ===\n");

  // Get user
  const { data: users } = await supabase
    .from("users")
    .select("id, email")
    .limit(1);

  if (!users || users.length === 0) {
    console.log("No users found");
    rl.close();
    return;
  }

  const userId = users[0].id;
  console.log(`User: ${users[0].email} (${userId})\n`);

  // Show current state
  const { data: activePrompts } = await supabase
    .from("active_prompts")
    .select("id, prompt_text, shown_count")
    .eq("user_id", userId);

  const { data: historyPrompts } = await supabase
    .from("prompt_history")
    .select("id")
    .eq("user_id", userId);

  console.log(`Active prompts: ${activePrompts?.length || 0}`);
  console.log(`History prompts: ${historyPrompts?.length || 0}\n`);

  if (activePrompts && activePrompts.length > 0) {
    console.log("Current active prompts:");
    activePrompts.forEach((p, i) => {
      console.log(
        `${i + 1}. [${p.shown_count || 0} skips] ${p.prompt_text.substring(0, 60)}...`
      );
    });
    console.log();
  }

  // Ask what to do
  const answer = await question(
    "What would you like to do?\n" +
      "  1. Clear localStorage hints (recommended - fixes stuck prompts)\n" +
      "  2. Delete all active prompts (nuclear option - will regenerate on next story save)\n" +
      "  3. Delete all prompt history (clean slate)\n" +
      "  4. Delete EVERYTHING (active + history)\n" +
      "  0. Cancel\n\n" +
      "Enter choice (0-4): "
  );

  const choice = parseInt(answer.trim());

  switch (choice) {
    case 1:
      console.log(
        "\n✓ To clear localStorage, open your browser console and run:"
      );
      console.log("  localStorage.clear()");
      console.log(
        "\nOr just for prompt-related items:"
      );
      console.log('  localStorage.removeItem("promptDismissals")');
      console.log('  Object.keys(localStorage).forEach(key => {');
      console.log('    if (key.startsWith("lastPromptShown_") || key.startsWith("promptsShownToday_")) {');
      console.log('      localStorage.removeItem(key);');
      console.log('    }');
      console.log('  });');
      break;

    case 2:
      const { error: deleteActiveError, count: deletedActive } = await supabase
        .from("active_prompts")
        .delete()
        .eq("user_id", userId);

      if (deleteActiveError) {
        console.error("\n❌ Error deleting active prompts:", deleteActiveError);
      } else {
        console.log(`\n✓ Deleted ${deletedActive || 0} active prompts`);
        console.log("New prompts will be generated when you save your next story.");
      }
      break;

    case 3:
      const { error: deleteHistoryError, count: deletedHistory } =
        await supabase
          .from("prompt_history")
          .delete()
          .eq("user_id", userId);

      if (deleteHistoryError) {
        console.error(
          "\n❌ Error deleting prompt history:",
          deleteHistoryError
        );
      } else {
        console.log(`\n✓ Deleted ${deletedHistory || 0} history records`);
      }
      break;

    case 4:
      const confirm = await question(
        "\n⚠️  This will delete ALL prompts (active + history). Continue? (yes/no): "
      );

      if (confirm.toLowerCase() !== "yes") {
        console.log("Cancelled.");
        break;
      }

      const { error: deleteActiveErr } = await supabase
        .from("active_prompts")
        .delete()
        .eq("user_id", userId);

      const { error: deleteHistoryErr } = await supabase
        .from("prompt_history")
        .delete()
        .eq("user_id", userId);

      if (deleteActiveErr || deleteHistoryErr) {
        console.error("\n❌ Errors occurred:", {
          active: deleteActiveErr,
          history: deleteHistoryErr,
        });
      } else {
        console.log("\n✓ Deleted all prompts and history");
        console.log("System will start fresh on your next story save.");
      }
      break;

    case 0:
    default:
      console.log("\nCancelled.");
      break;
  }

  rl.close();
}

resetPrompts().catch(console.error);
