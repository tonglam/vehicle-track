# Supabase Schema Setup Guide

This guide walks you through applying the Vehicle Track database schema to your Supabase project.

## Prerequisites

- A Supabase project created at [supabase.com](https://supabase.com)
- Project access credentials (see `env.example` for what you'll need)

## Step 1: Get Your Database Connection Strings

**Important**: We need the **Postgres connection strings**, NOT the Project API URL.

1. Go to your Supabase project dashboard
2. Click the **Settings** icon (⚙️) in the bottom left sidebar
3. In the Settings menu, click **Database** (NOT "API")
4. Scroll down to the **Connection string** section
5. You'll see different connection modes - copy these two:
   - **Transaction mode** (port 6543, pooler) → use for `SUPABASE_DATABASE_URL`
   - **Session mode** (port 5432, direct) → use for `SUPABASE_DIRECT_URL`
6. Click "Show" to reveal the full connection string
7. Save these to your `.env.local` file (see `env.example` template)

**What you should see**:

```
postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

**NOT** the Project API URL like:

```
https://[project-ref].supabase.co  ❌ (This is for Supabase JS client, not needed for Option A)
```

## Step 2: Apply the Schema

### Option A: Using Helper Script (Recommended)

```bash
./database/apply-schema.sh
```

This will automatically apply the schema from `database/scripts/001-initial-schema.sql`.

### Option B: Supabase SQL Editor

1. In your Supabase dashboard, go to **SQL Editor** (database icon in sidebar)
2. Click **New query**
3. Open `database/scripts/001-initial-schema.sql` from this repo
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`)
7. Wait for "Success. No rows returned" message

### Option C: Manual psql

If you prefer running manually:

```bash
source env.local
psql "$SUPABASE_DATABASE_URL" -f database/scripts/001-initial-schema.sql
```

## Step 3: Verify Schema Creation

### Quick Verification (Recommended)

```bash
./database/verify-schema.sh
```

This will check tables, enums, indexes, seeds, and triggers automatically.

### Manual Verification

#### Check Tables

In the Supabase dashboard:

1. Go to **Table Editor**
2. You should see 15 tables:
   - `roles`
   - `users`
   - `email_configs`
   - `vehicle_groups`
   - `vehicles`
   - `vehicle_group_assignments`
   - `vehicle_attachments`
   - `drivers`
   - `inspections`
   - `inspection_images`
   - `agreement_templates`
   - `agreements`
   - `driver_agreements`
   - `contractor_vehicle_checks`
   - `audit_logs`

### Check Seed Data

1. Click on the `roles` table
2. You should see 4 rows:
   - admin
   - manager
   - inspector
   - viewer

### Check Indexes

Run this query in SQL Editor:

```sql
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

You should see indexes like `idx_users_email`, `idx_vehicles_status`, etc.

### Check Enums

Run this query:

```sql
SELECT t.typname AS enum_name, e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN (
  'role_name',
  'vehicle_status',
  'ownership_type',
  'fuel_type',
  'transmission_type',
  'inspection_status',
  'inspection_image_section',
  'agreement_status',
  'driver_agreement_role',
  'contractor_check_status'
)
ORDER BY t.typname, e.enumsortorder;
```

## Step 4: (Optional) Create a Test Admin User

Once Better Auth is integrated in the Next.js app, you'll create users through the app. For now, you can manually create a test user:

```sql
-- Get the admin role ID
SELECT id FROM roles WHERE name = 'admin';

-- Insert test user (replace PASSWORD_HASH with a real bcrypt hash)
INSERT INTO users (username, email, phone, first_name, last_name, role_id, password_hash, active)
VALUES (
  'admin',
  'admin@example.com',
  '+61412345678',
  'Admin',
  'User',
  (SELECT id FROM roles WHERE name = 'admin'),
  '$2a$10$...',  -- Replace with real bcrypt hash
  TRUE
);
```

**Note**: Better Auth will handle password hashing when the app is running. Don't manually create users with weak passwords.

## Troubleshooting

### Error: "extension pgcrypto does not exist"

Run manually:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Error: "type ... already exists"

The schema was partially applied. Either:

- Drop all tables/enums and re-run, OR
- Comment out the already-created types/tables in the SQL file

### Error: "permission denied"

Ensure you're using the **postgres** role (default in Supabase). Check your connection string starts with `postgresql://postgres.[project-ref]:...`

## Next Steps

1. ✅ Schema applied
2. ✅ Seed data verified
3. Next: Integrate Drizzle ORM in the Next.js app
4. Next: Set up Better Auth with the `users` table
5. Next: Build API routes and services

## Schema Maintenance

- **Never modify the schema directly in production**
- When the Next.js app is set up with Drizzle, all future changes should be done via Drizzle migrations
- Keep `database/scripts/` as the source of truth for schema history
- See `database/README.md` for more information on the database scripts structure
