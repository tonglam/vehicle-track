import { hash } from "bcrypt";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

import { sql } from "drizzle-orm";
import { db } from "../drizzle/db";

async function resetAdminPassword() {
  console.log("Resetting admin password...");

  const newPassword = "admin123";
  const saltRounds = 10;

  try {
    // Hash the password using bcrypt (Better Auth's default)
    const hashedPassword = await hash(newPassword, saltRounds);
    console.log("Password hashed successfully");

    // Update the admin user's password
    await db.execute(sql`
      UPDATE users 
      SET password = ${hashedPassword}
      WHERE email = 'admin@vehicletrack.com';
    `);

    console.log("✅ Admin password updated successfully!");
    console.log("\nYou can now log in with:");
    console.log("  Email: admin@vehicletrack.com");
    console.log("  Password: admin123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to reset password:", error);
    process.exit(1);
  }
}

resetAdminPassword();
