# Database Scripts

This directory contains all database-related scripts for Vehicle Track.

## Structure

```
database/
├── scripts/           # SQL scripts (migrations, seeds, utilities)
│   └── 001-initial-schema.sql
├── apply-schema.sh    # Helper script to apply schema
└── verify-schema.sh   # Helper script to verify schema
```

## Scripts

### `scripts/001-initial-schema.sql`

Initial database schema including:

- All tables (15 total)
- Enums (10 types)
- Indexes (15 performance indexes)
- Triggers (9 updated_at triggers)
- Seed data (4 roles)

## Quick Start

See **[SETUP.md](./SETUP.md)** for detailed setup instructions.

## Usage

### Apply Schema (First Time Setup)

```bash
# Make sure .env.local is configured with SUPABASE_DATABASE_URL
./database/apply-schema.sh
```

### Verify Schema

```bash
# Check that all tables, enums, and seeds are present
./database/verify-schema.sh
```

### Manual Application

If you prefer to run manually:

```bash
source env.local
psql "$SUPABASE_DATABASE_URL" -f database/scripts/001-initial-schema.sql
```

## Migration Strategy

For now, we use numbered SQL files:

- `001-initial-schema.sql` - Base schema
- `002-*.sql` - Future migrations (when needed)

Once the Next.js app is set up with Drizzle, future schema changes will be managed via Drizzle migrations.

## Notes

- Never modify the database schema directly in production
- Always test migrations in development first
- Keep this directory as the source of truth for schema history

