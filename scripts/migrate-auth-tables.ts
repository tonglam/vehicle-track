// @ts-nocheck
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

import { sql } from "drizzle-orm";
import { db } from "../drizzle/db";

async function migrateAuthTables() {
  console.log("Adding sessions and accounts tables...");

  try {
    // Check if sessions table exists
    const sessionsExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sessions'
      );
    `);

    const sessionTableExists = sessionsExists[0]?.exists || false;

    if (!sessionTableExists) {
      await db.execute(sql`
        CREATE TABLE "sessions" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "user_id" uuid NOT NULL,
          "expires_at" timestamp NOT NULL,
          "token" text NOT NULL UNIQUE,
          "ip_address" text,
          "user_agent" text,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `);
      await db.execute(sql`
        ALTER TABLE "sessions" 
        ADD CONSTRAINT "sessions_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") 
        REFERENCES "public"."users"("id") 
        ON DELETE cascade;
      `);
      console.log("✅ Sessions table created");
    } else {
      console.log("ℹ️  Sessions table already exists");
    }

    // Check if accounts table exists
    const accountsExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'accounts'
      );
    `);

    const accountTableExists = accountsExists[0]?.exists || false;

    if (!accountTableExists) {
      await db.execute(sql`
        CREATE TABLE "accounts" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "user_id" uuid NOT NULL,
          "account_id" text NOT NULL,
          "provider_id" text NOT NULL,
          "access_token" text,
          "refresh_token" text,
          "expires_at" timestamp,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `);
      await db.execute(sql`
        ALTER TABLE "accounts" 
        ADD CONSTRAINT "accounts_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") 
        REFERENCES "public"."users"("id") 
        ON DELETE cascade;
      `);
      console.log("✅ Accounts table created");
    } else {
      console.log("ℹ️  Accounts table already exists");
    }

    // Add missing columns to users table if they don't exist
    const userColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users';
    `);

    const existingColumns = (userColumns as Array<{ column_name: string }>).map(
      (row) => row.column_name
    );

    if (!existingColumns.includes("email_verified")) {
      await db.execute(sql`
        ALTER TABLE "users" 
        ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;
      `);
      console.log("✅ Added email_verified column to users");
    }

    if (!existingColumns.includes("image")) {
      await db.execute(sql`
        ALTER TABLE "users" 
        ADD COLUMN "image" text;
      `);
      console.log("✅ Added image column to users");
    }

    if (!existingColumns.includes("name")) {
      await db.execute(sql`
        ALTER TABLE "users" 
        ADD COLUMN "name" text;
      `);
      console.log("✅ Added name column to users");
    }

    console.log("\n✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrateAuthTables();
