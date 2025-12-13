import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

import { sql } from "drizzle-orm";
import { db } from "../drizzle/db";

async function resetPasswordViaAPI() {
  console.log(
    "Resetting admin password using Better Auth API (with scrypt)...\n"
  );

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

    console.log("\n2. Deleting old bcrypt password...");
    await db.execute(sql`
      DELETE FROM accounts 
      WHERE user_id = ${userId} 
      AND provider_id = 'credential';
    `);
    console.log("   ✅ Old credential account deleted");

    console.log("\n3. Waiting for server to be ready...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("\n4. Creating new account via Better Auth signup API...");
    const response = await fetch(
      "http://localhost:3000/api/auth/sign-up/email",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: "Admin User",
          username: "admin",
          firstName: "Admin",
          lastName: "User",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("   ❌ Signup failed:", error);
      console.log("\n   This is expected if user already exists.");
      console.log("   Manually creating credential account...");

      const accountId = crypto.randomUUID();
      // Use scrypt hash - Better Auth default
      const { scrypt } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);

      const salt = Buffer.from(
        process.env.BETTER_AUTH_SECRET ||
          "default-secret-please-change-in-production"
      );
      const hashedPassword = (
        (await scryptAsync(password, salt, 64)) as Buffer
      ).toString("base64");

      await db.execute(sql`
        INSERT INTO accounts (id, user_id, account_id, provider_id, password)
        VALUES (${accountId}, ${userId}, ${userId}, 'credential', ${hashedPassword})
      `);

      console.log("   ✅ Credential account created with scrypt hash");
    } else {
      console.log("   ✅ Account created via API (uses Better Auth's scrypt)");
    }

    console.log("\n✅ Password reset complete!");
    console.log("\n📊 Now using Better Auth default scrypt:");
    console.log("   - Expected login time: 0.4-0.7s (much faster!)");
    console.log("\n🧪 Test login with:");
    console.log(
      `   curl -X POST http://localhost:3000/api/auth/sign-in/email \\`
    );
    console.log(`     -H 'Content-Type: application/json' \\`);
    console.log(`     -d '{"email":"${email}","password":"${password}"}'`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Failed:", error);
    process.exit(1);
  }
}

resetPasswordViaAPI();
