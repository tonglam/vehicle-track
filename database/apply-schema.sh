#!/usr/bin/env bash
set -e

# Vehicle Track - Apply Database Schema
# Usage: ./database/apply-schema.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment variables
if [ -f "$PROJECT_ROOT/env.local" ]; then
  source "$PROJECT_ROOT/env.local"
else
  echo "❌ Error: env.local not found. Please create it from env.example"
  exit 1
fi

# Check if SUPABASE_DATABASE_URL is set
if [ -z "$SUPABASE_DATABASE_URL" ]; then
  echo "❌ Error: SUPABASE_DATABASE_URL not set in env.local"
  exit 1
fi

echo "🚀 Applying Vehicle Track database schema..."
echo "📁 Using: $SCRIPT_DIR/scripts/001-initial-schema.sql"
echo ""

# Apply schema
psql "$SUPABASE_DATABASE_URL" -f "$SCRIPT_DIR/scripts/001-initial-schema.sql"

echo ""
echo "✅ Schema applied successfully!"
echo ""
echo "📊 Run './database/verify-schema.sh' to verify the installation"




