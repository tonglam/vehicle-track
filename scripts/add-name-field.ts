// @ts-nocheck
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

import { sql } from "drizzle-orm";
import { db } from "../drizzle/db";

async function addNameField() {
  console.log("Adding name field to users table...");

  try {
    // Check if name column exists and is nullable
    const columns = await db.execute(sql`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      AND column_name = 'name';
    `);

    if (columns && columns.length > 0) {
      console.log("ℹ️  Name column already exists");

      // Check if it's nullable
      const isNullable =
        (columns as Array<{ is_nullable: string }>)[0].is_nullable === "YES";

      if (isNullable) {
        console.log("Populating name field from firstName and lastName...");

        // Populate name field
        await db.execute(sql`
          UPDATE users 
          SET name = first_name || ' ' || last_name
          WHERE name IS NULL;
        `);

        console.log("Making name column NOT NULL...");

        // Make it NOT NULL
        await db.execute(sql`
          ALTER TABLE users 
          ALTER COLUMN name SET NOT NULL;
        `);

        console.log("✅ Name column updated to NOT NULL");
      } else {
        console.log("ℹ️  Name column is already NOT NULL");
      }
    } else {
      console.log("Creating name column...");

      // Add nullable column first
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN name TEXT;
      `);

      console.log("Populating name field from firstName and lastName...");

      // Populate it
      await db.execute(sql`
        UPDATE users 
        SET name = first_name || ' ' || last_name;
      `);

      console.log("Making name column NOT NULL...");

      // Make it NOT NULL
      await db.execute(sql`
        ALTER TABLE users 
        ALTER COLUMN name SET NOT NULL;
      `);

      console.log("✅ Name column added and populated");
    }

    console.log("\n✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

addNameField();
