// @ts-nocheck
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

import { sql } from "drizzle-orm";
import { db } from "../drizzle/db";

async function movePasswordToAccounts() {
  console.log("Moving password from users to accounts table...");

  try {
    // 1. Add password column to accounts table if it doesn't exist
    const accountColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'accounts'
      AND column_name = 'password';
    `);

    if (!accountColumns || accountColumns.length === 0) {
      console.log("Adding password column to accounts table...");
      await db.execute(sql`
        ALTER TABLE accounts 
        ADD COLUMN password TEXT;
      `);
      console.log("✅ Password column added to accounts");
    } else {
      console.log("ℹ️  Password column already exists in accounts");
    }

    // 2. Add missing OAuth columns to accounts table
    console.log("Adding OAuth-related columns to accounts table...");

    const allAccountColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'accounts';
    `);

    const existingAccountCols = (
      allAccountColumns as Array<{ column_name: string }>
    ).map((row) => row.column_name);

    if (!existingAccountCols.includes("access_token_expires_at")) {
      await db.execute(sql`
        ALTER TABLE accounts 
        ADD COLUMN access_token_expires_at TIMESTAMP;
      `);
      console.log("✅ Added access_token_expires_at");
    }

    if (!existingAccountCols.includes("refresh_token_expires_at")) {
      await db.execute(sql`
        ALTER TABLE accounts 
        ADD COLUMN refresh_token_expires_at TIMESTAMP;
      `);
      console.log("✅ Added refresh_token_expires_at");
    }

    if (!existingAccountCols.includes("scope")) {
      await db.execute(sql`
        ALTER TABLE accounts 
        ADD COLUMN scope TEXT;
      `);
      console.log("✅ Added scope");
    }

    if (!existingAccountCols.includes("id_token")) {
      await db.execute(sql`
        ALTER TABLE accounts 
        ADD COLUMN id_token TEXT;
      `);
      console.log("✅ Added id_token");
    }

    // 3. Check if users table still has password column
    const userColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      AND column_name = 'password';
    `);

    if (userColumns && userColumns.length > 0) {
      console.log("Migrating passwords from users to accounts...");

      // Copy password from users to accounts for credential accounts
      await db.execute(sql`
        UPDATE accounts 
        SET password = users.password
        FROM users 
        WHERE accounts.user_id = users.id 
        AND accounts.provider_id = 'credential'
        AND accounts.password IS NULL;
      `);

      console.log("✅ Passwords migrated to accounts table");

      console.log("Dropping password column from users table...");
      await db.execute(sql`
        ALTER TABLE users 
        DROP COLUMN password;
      `);
      console.log("✅ Password column dropped from users");
    } else {
      console.log("ℹ️  Password column not found in users table");
    }

    console.log("\n✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

movePasswordToAccounts();
