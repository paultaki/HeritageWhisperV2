
import dotenv from "dotenv";
import { Client } from "pg";

// Load env vars
dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

console.log("Testing connection to:", connectionString?.replace(/:[^:@]+@/, ":****@")); // Hide password in logs

if (!connectionString) {
    console.error("❌ DATABASE_URL is missing from environment");
    process.exit(1);
}

const client = new Client({
    connectionString,
});

async function testConnection() {
    try {
        await client.connect();
        console.log("✅ Successfully connected to the database!");

        const res = await client.query('SELECT NOW()');
        console.log("📅 Database time:", res.rows[0].now);

        await client.end();
        process.exit(0);
    } catch (err) {
        console.error("❌ Connection failed:", err);
        process.exit(1);
    }
}

testConnection();
