import { sql } from "drizzle-orm";
import { db } from "../drizzle/db";

async function checkConnection() {
  try {
    console.log("🔍 Testing database connection...");

    // Try a simple query
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log("✅ Database connection successful!");

    // Check if roles table exists
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'roles'
    `);

    if (tables.length === 0) {
      console.log("❌ Schema not applied! The 'roles' table doesn't exist.");
      console.log("📝 Please run the schema SQL in Supabase SQL Editor:");
      console.log("   File: database/scripts/001-initial-schema.sql");
      process.exit(1);
    }

    console.log("✅ Schema exists!");

    // Check if roles are seeded
    const rolesCheck = await db.execute(
      sql`SELECT COUNT(*) as count FROM roles`
    );
    const roleCount =
      rolesCheck.length > 0 && rolesCheck[0] ? rolesCheck[0].count : 0;
    console.log(`✅ Roles table has ${roleCount} roles`);
  } catch (error) {
    console.error("❌ Connection failed:", error);
    console.log("\n💡 Troubleshooting:");
    console.log("1. Check .env.local has correct SUPABASE_DATABASE_URL");
    console.log("2. Verify your Supabase project is active");
    console.log("3. Ensure IP/firewall allows connection");
    process.exit(1);
  }
}

checkConnection();
