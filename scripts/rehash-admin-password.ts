import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

import { hash } from "bcrypt";
import { sql } from "drizzle-orm";
import { db } from "../drizzle/db";

async function rehashAdminPassword() {
  console.log("Re-hashing admin password with 8 rounds for development...\n");

  try {
    const email = "admin@vehicletrack.com";
    const newPassword = "admin123";
    const saltRounds = 8; // Faster for development

    console.log(`1. Hashing password with ${saltRounds} rounds (faster)...`);
    const hashedPassword = await hash(newPassword, saltRounds);
    console.log(`   ✅ Password hashed: ${hashedPassword.substring(0, 20)}...`);

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

    console.log("\n3. Updating password in accounts table...");
    await db.execute(sql`
      UPDATE accounts 
      SET password = ${hashedPassword}
      WHERE user_id = ${userId} 
      AND provider_id = 'credential';
    `);
    console.log("   ✅ Password updated in accounts table");

    console.log("\n✅ Admin password re-hashed successfully!");
    console.log("\n📊 Performance improvement:");
    console.log("   - 10 rounds: ~300-1000ms");
    console.log("   - 8 rounds: ~100-300ms");
    console.log("   - Expected speedup: 3-4x faster");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Failed to update password:", error);
    process.exit(1);
  }
}

rehashAdminPassword();
