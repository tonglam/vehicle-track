#!/usr/bin/env bash
set -e

# Vehicle Track - Verify Database Schema
# Usage: ./database/verify-schema.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment variables
if [ -f "$PROJECT_ROOT/env.local" ]; then
  source "$PROJECT_ROOT/env.local"
else
  echo "❌ Error: env.local not found"
  exit 1
fi

if [ -z "$SUPABASE_DATABASE_URL" ]; then
  echo "❌ Error: SUPABASE_DATABASE_URL not set"
  exit 1
fi

echo "🔍 Verifying Vehicle Track database schema..."
echo ""

# Check tables
echo "📊 Tables:"
TABLE_COUNT=$(psql "$SUPABASE_DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "   Found: $TABLE_COUNT tables (expected: 15)"

if [ "$TABLE_COUNT" -eq 15 ]; then
  echo "   ✅ All tables present"
else
  echo "   ⚠️  Table count mismatch"
fi
echo ""

# Check enums
echo "🏷️  Enums:"
ENUM_COUNT=$(psql "$SUPABASE_DATABASE_URL" -t -c "SELECT COUNT(DISTINCT typname) FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname IN ('role_name', 'vehicle_status', 'ownership_type', 'fuel_type', 'transmission_type', 'inspection_status', 'inspection_image_section', 'agreement_status', 'driver_agreement_role', 'contractor_check_status');")
echo "   Found: $ENUM_COUNT enum types (expected: 10)"

if [ "$ENUM_COUNT" -eq 10 ]; then
  echo "   ✅ All enum types present"
else
  echo "   ⚠️  Enum count mismatch"
fi
echo ""

# Check indexes
echo "🔍 Indexes:"
INDEX_COUNT=$(psql "$SUPABASE_DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';")
echo "   Found: $INDEX_COUNT indexes (expected: 15)"

if [ "$INDEX_COUNT" -eq 15 ]; then
  echo "   ✅ All indexes present"
else
  echo "   ⚠️  Index count mismatch"
fi
echo ""

# Check role seeds
echo "🌱 Seed Data:"
ROLE_COUNT=$(psql "$SUPABASE_DATABASE_URL" -t -c "SELECT COUNT(*) FROM roles;")
echo "   Found: $ROLE_COUNT roles (expected: 4)"

if [ "$ROLE_COUNT" -eq 4 ]; then
  echo "   ✅ All roles seeded"
  psql "$SUPABASE_DATABASE_URL" -c "SELECT name, description FROM roles ORDER BY name;" | head -n 7
else
  echo "   ⚠️  Role count mismatch"
fi
echo ""

# Check triggers
echo "⚡ Triggers:"
TRIGGER_COUNT=$(psql "$SUPABASE_DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND t.tgname LIKE 'update_%_updated_at';")
echo "   Found: $TRIGGER_COUNT updated_at triggers (expected: 9)"

if [ "$TRIGGER_COUNT" -ge 9 ]; then
  echo "   ✅ All triggers present"
else
  echo "   ⚠️  Trigger count mismatch"
fi
echo ""

echo "✅ Verification complete!"

