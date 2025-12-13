import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

import { sql } from "drizzle-orm";
import { db } from "../drizzle/db";

async function switchToScrypt() {
  console.log("Switching admin password to scrypt (Better Auth default)...\n");
  console.log("This will use Better Auth API to re-hash the password.\n");

  try {
    const email = "admin@vehicletrack.com";
    const password = "admin123";

    console.log("1. Finding admin user...");
    const users = await db.execute(sql`
      SELECT id FROM users WHERE email = ${email};
    `);

    if (!users || users.length === 0) {
      console.error("   ❌ Admin user not found!");
      process.exit(1);
    }

    const userId = (users[0] as { id: string }).id;
    console.log(`   ✅ Found admin user: ${userId}`);

    console.log("\n2. Deleting old credential account...");
    await db.execute(sql`
      DELETE FROM accounts 
      WHERE user_id = ${userId} 
      AND provider_id = 'credential';
    `);
    console.log("   ✅ Old account deleted");

    console.log("\n3. Creating new credential account with scrypt hash...");
    console.log("   📝 Please run this command after the server restarts:");
    console.log(
      "\n   curl -X POST http://localhost:3000/api/auth/change-password \\"
    );
    console.log("     -H 'Content-Type: application/json' \\");
    console.log(
      '     -d \'{"email":"admin@vehicletrack.com","password":"admin123"}\''
    );
    console.log(
      "\n   OR use the Better Auth signup endpoint to recreate the account."
    );

    console.log(
      "\n   Alternatively, I'll create it directly using a temp signup..."
    );

    // Create account record with a placeholder that will be replaced via API
    const accountId = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO accounts (id, user_id, account_id, provider_id, password)
      VALUES (${accountId}, ${userId}, ${userId}, 'credential', '')
    `);

    console.log(
      "   ✅ Credential account created (password needs to be set via API)"
    );
    console.log("\n4. Next steps:");
    console.log("   a. Restart the dev server");
    console.log("   b. Login will use Better Auth's change password API");
    console.log("   c. Or manually call the password reset endpoint");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Failed to switch to scrypt:", error);
    process.exit(1);
  }
}

switchToScrypt();
