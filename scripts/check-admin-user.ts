import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

import { sql } from "drizzle-orm";
import { db } from "../drizzle/db";

async function checkAdminUser() {
  console.log("Checking admin user...\n");

  try {
    // Get admin user details
    const user = await db.execute(sql`
      SELECT id, email, username, password, name, email_verified
      FROM users 
      WHERE email = 'admin@vehicletrack.com';
    `);

    console.log("User data:");
    console.log(JSON.stringify(user[0], null, 2));

    // Get account data
    const account = await db.execute(sql`
      SELECT id, user_id, account_id, provider_id
      FROM accounts 
      WHERE user_id = ${(user as any)[0].id};
    `);

    console.log("\nAccount data:");
    console.log(JSON.stringify(account[0] || "No account found", null, 2));

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkAdminUser();
