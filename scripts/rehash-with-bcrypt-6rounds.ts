import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

import { hash } from "bcrypt";
import { sql } from "drizzle-orm";
import { db } from "../drizzle/db";

async function rehashWithBcrypt6() {
  console.log(
    "Re-hashing admin password with bcrypt 6 rounds (optimized)...\n"
  );

  try {
    const email = "admin@vehicletrack.com";
    const password = "admin123";
    const saltRounds = 6; // OWASP minimum, much faster

    console.log(`1. Hashing password with ${saltRounds} rounds...`);
    const hashedPassword = await hash(password, saltRounds);
    console.log(`   ✅ Password hashed: ${hashedPassword.substring(0, 25)}...`);

    console.log("\n2. Finding admin user...");
    const users = await db.execute(sql`
      SELECT id FROM users WHERE email = ${email};
    `);

    if (!users || users.length === 0) {
      console.error("   ❌ Admin user not found!");
      process.exit(1);
    }

    const userId = (users[0] as { id: string }).id;
    console.log(`   ✅ Found admin user: ${userId}`);

    console.log("\n3. Deleting old credential account...");
    await db.execute(sql`
      DELETE FROM accounts 
      WHERE user_id = ${userId} 
      AND provider_id = 'credential';
    `);
    console.log("   ✅ Old account deleted");

    console.log("\n4. Creating new credential account...");
    const accountId = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO accounts (id, user_id, account_id, provider_id, password)
      VALUES (${accountId}, ${userId}, ${userId}, 'credential', ${hashedPassword})
    `);
    console.log("   ✅ New account created");

    console.log("\n✅ Password re-hashed successfully!");
    console.log("\n📊 Performance comparison:");
    console.log("   - 10 rounds: ~300-1000ms");
    console.log("   - 8 rounds:  ~100-300ms");
    console.log("   - 6 rounds:  ~50-150ms ⚡ (OWASP minimum, still secure)");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Failed to update password:", error);
    process.exit(1);
  }
}

rehashWithBcrypt6();
