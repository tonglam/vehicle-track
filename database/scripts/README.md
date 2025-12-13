# Database Migration Scripts

## How to Run SQL Scripts

### Using Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **+ New query**
5. Copy and paste the SQL script content
6. Click **Run** or press `Ctrl/Cmd + Enter`

### Using Local Database

If you have direct database access:

```bash
psql -h your-db-host -U your-user -d your-database -f path/to/script.sql
```

## Available Scripts

### fix-existing-vehicles-default-group.sql

**Purpose:** One-time migration to assign existing vehicles to Default Group

**When to run:** After adding the GROUP column feature, to fix existing vehicles with null group_id

**What it does:**

- Creates "Default Group" if it doesn't exist
- Assigns all vehicles with `group_id = NULL` to Default Group
- Shows verification results

**Status:** Run once, then delete or archive

---

## Best Practices

- ✅ Always backup your database before running migrations
- ✅ Test migrations on a development/staging database first
- ✅ Review the SQL script before running
- ✅ Run scripts during low-traffic periods
- ✅ Keep migration scripts in version control
- ❌ Never run migrations through application runtime endpoints
- ❌ Never run untested scripts on production directly
