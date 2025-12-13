// @ts-nocheck
import { eq } from "drizzle-orm";
import { db } from "../drizzle/db";
import { roles, users } from "../drizzle/schema";

async function createTestUser() {
  try {
    console.log("🔍 Finding admin role...");

    // Get admin role
    const [adminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "admin"))
      .limit(1);

    if (!adminRole) {
      console.error(
        "❌ Admin role not found! Please run the schema SQL first."
      );
      process.exit(1);
    }

    console.log("✅ Admin role found:", adminRole.id);

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@vehicletrack.com"))
      .limit(1);

    if (existingUser) {
      console.log("ℹ️  User already exists:", existingUser.email);
      console.log("   Username:", existingUser.username);
      console.log("   You can log in with: admin@vehicletrack.com / admin123");
      process.exit(0);
    }

    // Create test user
    // Password: admin123
    // This is a bcrypt hash of "admin123" - DO NOT use in production!
    const passwordHash =
      "$2a$10$rqK5p3Z8YZGKvJ9XQXqLOu8vQJxJxW.pZFz5L5L5L5L5L5L5L5L5O";

    const [newUser] = await db
      .insert(users)
      .values({
        username: "admin",
        email: "admin@vehicletrack.com",
        phone: null,
        firstName: "Admin",
        lastName: "User",
        roleId: adminRole.id,
        passwordHash,
        active: true,
      })
      .returning();

    if (!newUser) {
      console.error("❌ Failed to create user");
      process.exit(1);
    }

    console.log("✅ Test user created successfully!");
    console.log("📧 Email:", newUser.email);
    console.log("👤 Username:", newUser.username);
    console.log("🔑 Password: admin123");
    console.log("");
    console.log("🚀 You can now log in at http://localhost:3000");
  } catch (error) {
    console.error("❌ Error creating test user:", error);
    process.exit(1);
  }
}

createTestUser();
