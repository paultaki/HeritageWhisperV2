
import { db } from "../lib/db";
import { chapters } from "../shared/schema";

async function main() {
    console.log("Checking db.query.chapters...");
    if (db.query.chapters) {
        console.log("db.query.chapters is DEFINED");
    } else {
        console.error("db.query.chapters is UNDEFINED");
    }

    console.log("Checking chapters table object... DONE");
}

main().catch(console.error);
