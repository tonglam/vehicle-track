import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "../drizzle/db";
import { organizations } from "../drizzle/schema";

async function verifyOrganizationsTable() {
  try {
    console.log("🔍 Verifying organizations table...");

    // Try to query the organizations table
    const result = await db.select().from(organizations).limit(1);

    console.log("✅ Organizations table exists!");
    console.log(`📊 Found ${result.length} organization(s)`);

    if (result.length > 0) {
      console.log("\nSample data:");
      console.log(result[0]);
    } else {
      console.log("\n💡 Table is empty (no organizations created yet)");
    }

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error verifying organizations table:", error.message);
    console.log("\n📝 If the error says table doesn't exist, you may need to:");
    console.log("   1. Check your Supabase dashboard → Table Editor");
    console.log("   2. Verify the migration was applied successfully");
    process.exit(1);
  }
}

verifyOrganizationsTable();
