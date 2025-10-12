/**
 * Debug script to check prompt deduplication
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPrompts() {
  // Get user ID (assuming there's only one user for now)
  const { data: users } = await supabase
    .from("users")
    .select("id, email")
    .limit(1);

  if (!users || users.length === 0) {
    console.log("No users found");
    return;
  }

  const userId = users[0].id;
  console.log(`Checking prompts for user: ${users[0].email} (${userId})\n`);

  // Check active prompts
  const { data: activePrompts } = await supabase
    .from("active_prompts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  console.log(`=== ACTIVE PROMPTS (${activePrompts?.length || 0}) ===`);
  activePrompts?.forEach((prompt) => {
    console.log(`\nPrompt: ${prompt.prompt_text}`);
    console.log(`  Entity: ${prompt.anchor_entity}`);
    console.log(`  Year: ${prompt.anchor_year}`);
    console.log(`  Hash: ${prompt.anchor_hash}`);
    console.log(`  Tier: ${prompt.tier}`);
    console.log(`  Created: ${new Date(prompt.created_at).toLocaleDateString()}`);
    console.log(`  Expires: ${new Date(prompt.expires_at).toLocaleDateString()}`);
  });

  // Check prompt history
  const { data: historyPrompts } = await supabase
    .from("prompt_history")
    .select("*")
    .eq("user_id", userId)
    .order("resolved_at", { ascending: false })
    .limit(20);

  console.log(`\n\n=== PROMPT HISTORY (${historyPrompts?.length || 0}) ===`);
  historyPrompts?.forEach((prompt) => {
    console.log(`\nPrompt: ${prompt.prompt_text}`);
    console.log(`  Entity: ${prompt.anchor_entity}`);
    console.log(`  Hash: ${prompt.anchor_hash}`);
    console.log(`  Outcome: ${prompt.outcome}`);
    console.log(`  Resolved: ${new Date(prompt.resolved_at).toLocaleDateString()}`);
  });

  // Check for duplicate hashes
  console.log("\n\n=== CHECKING FOR DUPLICATES ===");
  
  // Duplicates in active
  const activeHashes = new Map<string, number>();
  activePrompts?.forEach((p) => {
    const count = activeHashes.get(p.anchor_hash) || 0;
    activeHashes.set(p.anchor_hash, count + 1);
  });
  
  const activeDupes = Array.from(activeHashes.entries()).filter(([_, count]) => count > 1);
  if (activeDupes.length > 0) {
    console.log("\nDuplicate hashes in active_prompts:");
    activeDupes.forEach(([hash, count]) => {
      console.log(`  ${hash}: ${count} times`);
    });
  } else {
    console.log("\nNo duplicates in active_prompts ✓");
  }

  // Check if history prompts are being regenerated
  const historyHashes = new Set(historyPrompts?.map((p) => p.anchor_hash) || []);
  const regenerated = activePrompts?.filter((p) => historyHashes.has(p.anchor_hash)) || [];
  
  if (regenerated.length > 0) {
    console.log("\n⚠️  FOUND REGENERATED PROMPTS (in both active and history):");
    regenerated.forEach((prompt) => {
      console.log(`\n  "${prompt.prompt_text}"`);
      console.log(`    Hash: ${prompt.anchor_hash}`);
      console.log(`    History outcome: ${historyPrompts?.find(p => p.anchor_hash === prompt.anchor_hash)?.outcome}`);
    });
  } else {
    console.log("\nNo regenerated prompts ✓");
  }

  // Check the specific "housebroken by love" prompt
  const chewyPrompt = "housebroken by love";
  const chewyInActive = activePrompts?.filter((p) => 
    p.prompt_text.toLowerCase().includes(chewyPrompt)
  ) || [];
  const chewyInHistory = historyPrompts?.filter((p) => 
    p.prompt_text.toLowerCase().includes(chewyPrompt)
  ) || [];

  console.log(`\n\n=== CHECKING "HOUSEBROKEN BY LOVE" PROMPT ===`);
  console.log(`In active_prompts: ${chewyInActive.length}`);
  console.log(`In prompt_history: ${chewyInHistory.length}`);
  
  if (chewyInActive.length > 0) {
    console.log("\nActive instances:");
    chewyInActive.forEach((p) => {
      console.log(`  Hash: ${p.anchor_hash}`);
      console.log(`  Created: ${new Date(p.created_at).toISOString()}`);
    });
  }
  
  if (chewyInHistory.length > 0) {
    console.log("\nHistory instances:");
    chewyInHistory.forEach((p) => {
      console.log(`  Hash: ${p.anchor_hash}`);
      console.log(`  Outcome: ${p.outcome}`);
      console.log(`  Resolved: ${new Date(p.resolved_at).toISOString()}`);
    });
  }
}

checkPrompts().catch(console.error);
