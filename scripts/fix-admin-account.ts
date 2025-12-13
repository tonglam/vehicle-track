// @ts-nocheck
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

import { sql } from "drizzle-orm";
import { db } from "../drizzle/db";

async function fixAdminAccount() {
  console.log("Fixing admin account for Better Auth...");

  try {
    // Find the admin user
    const adminUser = await db.execute(sql`
      SELECT id, email 
      FROM users 
      WHERE email = 'admin@vehicletrack.com';
    `);

    if (!adminUser || adminUser.length === 0) {
      console.error("❌ Admin user not found!");
      process.exit(1);
    }

    const userId = (adminUser as Array<{ id: string; email: string }>)[0].id;
    console.log(`Found admin user: ${userId}`);

    // Check if credential account already exists
    const existingAccount = await db.execute(sql`
      SELECT id 
      FROM accounts 
      WHERE user_id = ${userId} 
      AND provider_id = 'credential';
    `);

    if (existingAccount && existingAccount.length > 0) {
      console.log("ℹ️  Credential account already exists");
      process.exit(0);
    }

    // Create credential account entry
    await db.execute(sql`
      INSERT INTO accounts (user_id, account_id, provider_id)
      VALUES (${userId}, ${userId}, 'credential');
    `);

    console.log("✅ Credential account created for admin user");
    console.log("\n✅ Admin account fixed! You can now log in.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to fix admin account:", error);
    process.exit(1);
  }
}

fixAdminAccount();
