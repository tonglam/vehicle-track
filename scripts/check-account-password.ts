import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

import { sql } from "drizzle-orm";
import { db } from "../drizzle/db";

async function checkAccountPassword() {
  console.log("Checking account password...\n");

  try {
    // Get admin user's account
    const account = await db.execute(sql`
      SELECT a.id, a.user_id, a.provider_id, a.password, u.email
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      WHERE u.email = 'admin@vehicletrack.com'
      AND a.provider_id = 'credential';
    `);

    if (!account || account.length === 0) {
      console.error("❌ No credential account found for admin!");
      process.exit(1);
    }

    console.log("Account data:");
    const acc = (account as any)[0];
    console.log(`User ID: ${acc.user_id}`);
    console.log(`Provider: ${acc.provider_id}`);
    console.log(
      `Password (first 50 chars): ${acc.password?.substring(0, 50)}...`
    );
    console.log(`Password length: ${acc.password?.length || 0}`);
    console.log(
      `Password starts with $2b: ${acc.password?.startsWith("$2b") ? "✅ Yes (bcrypt)" : "❌ No"}`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkAccountPassword();
