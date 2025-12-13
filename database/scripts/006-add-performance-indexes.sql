-- Add performance indexes for better query performance
-- These indexes improve search performance on user fields

-- Index for first name searches
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);

-- Index for last name searches
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);

-- Composite index for common search patterns (first + last name)
CREATE INDEX IF NOT EXISTS idx_users_name ON users(first_name, last_name);

-- Index for created_at ordering (already exists but ensuring it's there)
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Index for role + active status (for filtering)
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role_id, active);

-- Index for active status filtering
CREATE INDEX IF NOT EXISTS idx_users_active_only ON users(active) WHERE active = true;