import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

import { sql } from "drizzle-orm";
import { db } from "../drizzle/db";

async function addDisplayUsername() {
  console.log("Adding displayUsername field to users table...");

  try {
    // Check if displayUsername column exists
    const columns = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      AND column_name = 'display_username';
    `);

    if (columns && columns.length > 0) {
      console.log("ℹ️  displayUsername column already exists");
    } else {
      console.log("Creating displayUsername column...");

      // Add column
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN display_username TEXT;
      `);

      // Populate with username values
      await db.execute(sql`
        UPDATE users 
        SET display_username = username;
      `);

      console.log("✅ displayUsername column added and populated");
    }

    // Check if username column has unique constraint
    const constraints = await db.execute(sql`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%username%';
    `);

    if (!constraints || constraints.length === 0) {
      console.log("Adding unique constraint to username...");
      await db.execute(sql`
        ALTER TABLE users 
        ADD CONSTRAINT users_username_unique UNIQUE (username);
      `);
      console.log("✅ Unique constraint added to username");
    } else {
      console.log("ℹ️  Username already has unique constraint");
    }

    console.log("\n✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

addDisplayUsername();
