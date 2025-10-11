require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

async function checkTables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("Checking available tables...\n");

    // Check what we can query
    const tables = ["users", "stories", "family_members"];

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select("*").limit(1);

      if (error) {
        console.log(`❌ Table '${table}':`, error.message);
      } else {
        console.log(
          `✅ Table '${table}' exists with columns:`,
          Object.keys(data[0] || {}),
        );
      }
    }

    // Try to get auth user metadata structure
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(supabaseServiceKey);
    console.log("\nAuth user structure available:", user ? "Yes" : "No");
    if (authError) console.log("Auth error:", authError.message);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkTables();
