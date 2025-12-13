// @ts-nocheck
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

import { sql } from "drizzle-orm";
import { db } from "../drizzle/db";

async function renamePasswordColumn() {
  console.log("Renaming password_hash column to password...");

  try {
    // Check if password_hash column exists
    const columns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users';
    `);

    const columnNames = (columns as Array<{ column_name: string }>).map(
      (row) => row.column_name
    );

    if (columnNames.includes("password_hash")) {
      await db.execute(sql`
        ALTER TABLE users 
        RENAME COLUMN password_hash TO password;
      `);
      console.log("✅ Column renamed: password_hash → password");
    } else if (columnNames.includes("password")) {
      console.log("ℹ️  password column already exists");
    } else {
      console.error("❌ Neither password_hash nor password column found!");
      process.exit(1);
    }

    console.log("\n✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

renamePasswordColumn();
