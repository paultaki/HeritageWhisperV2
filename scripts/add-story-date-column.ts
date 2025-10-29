/**
 * Script to add the story_date column to the stories table
 * Run with: npx tsx scripts/add-story-date-column.ts
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

// Extract connection string for direct PostgreSQL access
const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
const connectionString = `postgresql://postgres.[project_ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

// We'll use Supabase SQL query functionality instead
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function addColumnAndReload() {
  const client = await pool.connect();

  try {
    console.log("🔍 Checking current columns in stories table...\n");

    // Check current columns
    const columnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'stories'
      ORDER BY column_name;
    `);

    const hasStoryDate = columnsResult.rows.some(
      (row) => row.column_name === "story_date"
    );

    if (hasStoryDate) {
      console.log("✅ Column story_date already exists!");
      console.log("\n📋 Current story-date related columns:");
      columnsResult.rows
        .filter((row) => row.column_name.includes("story") || row.column_name.includes("year"))
        .forEach((row) => {
          console.log(`   - ${row.column_name}: ${row.data_type}`);
        });
    } else {
      console.log("❌ Column story_date does NOT exist. Adding it now...\n");

      // Add the column
      await client.query(`
        ALTER TABLE stories ADD COLUMN story_date TIMESTAMP;
      `);

      console.log("✅ Column story_date added successfully!");

      // Trigger PostgREST schema cache reload
      console.log("\n🔄 Triggering PostgREST schema cache reload...");
      await client.query(`NOTIFY pgrst, 'reload schema';`);
      console.log("✅ Schema cache reload signal sent!");

      // Verify the column was added
      const verifyResult = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'stories' AND column_name = 'story_date';
      `);

      if (verifyResult.rows.length > 0) {
        console.log(
          "\n✅ Verification successful! Column details:",
          verifyResult.rows[0]
        );
      } else {
        console.log("\n❌ Verification failed - column not found after creation");
      }
    }

    console.log("\n📋 All story-date related columns:");
    const finalColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'stories'
        AND (column_name LIKE '%story%' OR column_name LIKE '%year%' OR column_name LIKE '%date%')
      ORDER BY column_name;
    `);

    finalColumns.rows.forEach((row) => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });

    console.log(
      "\n✅ Done! You can now save stories with month/day information."
    );
    console.log(
      "⚠️  Note: It may take a few seconds for PostgREST to reload its cache."
    );
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addColumnAndReload()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
