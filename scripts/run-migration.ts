/**
 * Manual migration runner for profile_interests column
 * Usage: npx tsx scripts/run-migration.ts
 */
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function runMigration() {
  console.log("📦 Adding profile_interests column to users table...");
  console.log("─".repeat(50));

  try {
    // Run the migration SQL directly
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id")
      .limit(1);

    if (error) {
      console.error("❌ Database connection failed:", error.message);
      process.exit(1);
    }

    console.log("✅ Database connection successful");
    console.log("\n⚠️  Please run this SQL in your Supabase Dashboard > SQL Editor:");
    console.log("─".repeat(50));
    console.log(`
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_interests JSONB;

COMMENT ON COLUMN users.profile_interests IS
'User interests for personalized prompt generation. Structure: { general, people, places }. Used to create more relevant and personal reflection questions.';
    `);
    console.log("─".repeat(50));
  } catch (err: any) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

runMigration();
