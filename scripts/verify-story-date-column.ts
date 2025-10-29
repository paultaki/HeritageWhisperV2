/**
 * Script to verify and add the story_date column to the stories table
 * Run with: npx tsx scripts/verify-story-date-column.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkAndAddColumn() {
  console.log("🔍 Checking if story_date column exists in stories table...\n");

  // Check if column exists
  const { data: columns, error: checkError } = await supabase.rpc(
    "get_column_info",
    {
      table_name: "stories",
      column_name: "story_date",
    }
  );

  if (checkError) {
    console.error("❌ Error checking column:", checkError.message);
    console.log("\n📝 Trying alternative method (query a story)...\n");

    // Try to query a story to see what columns exist
    const { data: story, error: queryError } = await supabase
      .from("stories")
      .select("*")
      .limit(1)
      .single();

    if (queryError) {
      console.error("❌ Error querying stories:", queryError.message);
    } else if (story) {
      const hasColumn = "story_date" in story;
      console.log(`Column story_date exists: ${hasColumn}`);
      console.log("\nAvailable columns in stories table:");
      console.log(Object.keys(story).sort().join(", "));
    }

    console.log("\n📋 To fix this, you need to run the migration manually:");
    console.log("1. Go to Supabase Dashboard > SQL Editor");
    console.log("2. Run the migration file: migrations/0015_ensure_story_date_column.sql");
    console.log(
      "3. Or run this SQL directly:\n\n" +
        "ALTER TABLE stories ADD COLUMN IF NOT EXISTS story_date TIMESTAMP;\n" +
        "NOTIFY pgrst, 'reload schema';\n"
    );

    return;
  }

  if (columns && columns.length > 0) {
    console.log("✅ Column story_date exists in stories table");
    console.log("Column details:", columns);

    // Trigger schema cache reload
    console.log("\n🔄 Triggering PostgREST schema cache reload...");
    const { error: reloadError } = await supabase.rpc("reload_schema");

    if (reloadError) {
      console.log(
        "⚠️  Could not trigger automatic reload:",
        reloadError.message
      );
      console.log(
        "\n📋 To reload the schema cache manually, run this SQL in Supabase Dashboard:"
      );
      console.log("NOTIFY pgrst, 'reload schema';\n");
    } else {
      console.log("✅ Schema cache reload triggered successfully");
    }
  } else {
    console.log("❌ Column story_date does NOT exist in stories table");
    console.log("\n📋 To fix this, run the migration:");
    console.log(
      "1. Go to Supabase Dashboard > SQL Editor\n" +
        "2. Run: ALTER TABLE stories ADD COLUMN story_date TIMESTAMP;\n" +
        "3. Run: NOTIFY pgrst, 'reload schema';\n"
    );
  }
}

checkAndAddColumn()
  .then(() => {
    console.log("\n✅ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
