
import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function listColumns() {
    try {
        await client.connect();
        const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stories'
      ORDER BY column_name;
    `);

        console.log("Columns in 'stories' table:");
        res.rows.forEach(row => console.log(`- ${row.column_name}`));

        await client.end();
    } catch (err) {
        console.error("Error listing columns:", err);
        process.exit(1);
    }
}

listColumns();
