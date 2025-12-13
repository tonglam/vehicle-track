-- ================================================
-- Migration: Vehicle Group Assignment Refactor
-- ================================================
-- This migration:
-- 1. Renames vehicle_group_assignments to group_manager_assignments (backup)
-- 2. Re-creates vehicle_group_assignments for vehicle-to-group assignments
-- 3. Migrates existing group assignments from vehicles.group_id
-- 4. Removes group_id column from vehicles table
--
-- Run this in Supabase SQL Editor or via psql
-- ================================================

BEGIN;

-- Step 1: Rename the old manager assignments table (if it exists and has data)
-- This preserves any existing manager-to-group assignments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_group_assignments') THEN
    -- Check if the table has the old structure (manager_id)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'vehicle_group_assignments' AND column_name = 'manager_id'
    ) THEN
      -- Rename to backup table
      ALTER TABLE vehicle_group_assignments RENAME TO group_manager_assignments;
      RAISE NOTICE 'Renamed vehicle_group_assignments to group_manager_assignments';
    END IF;
  END IF;
END $$;

-- Step 2: Create the new vehicle_group_assignments table for vehicle-to-group assignments
CREATE TABLE IF NOT EXISTS vehicle_group_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES vehicle_groups(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Ensure a vehicle can only belong to one group at a time
  UNIQUE(vehicle_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicle_group_assignments_vehicle_id 
  ON vehicle_group_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_group_assignments_group_id 
  ON vehicle_group_assignments(group_id);

COMMENT ON TABLE vehicle_group_assignments IS 'Junction table for vehicle-to-group assignments';
COMMENT ON COLUMN vehicle_group_assignments.vehicle_id IS 'The vehicle being assigned to a group';
COMMENT ON COLUMN vehicle_group_assignments.group_id IS 'The group the vehicle is assigned to';
COMMENT ON COLUMN vehicle_group_assignments.assigned_at IS 'When the vehicle was assigned to this group';
COMMENT ON COLUMN vehicle_group_assignments.assigned_by IS 'User who assigned the vehicle to this group';

-- Step 2: Migrate existing data from vehicles.group_id (if column exists)
DO $$
DECLARE
  admin_user_id UUID;
  migrated_count INTEGER;
  has_group_id BOOLEAN;
BEGIN
  -- Check if vehicles table has group_id column
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'group_id'
  ) INTO has_group_id;

  IF NOT has_group_id THEN
    RAISE NOTICE 'vehicles.group_id column does not exist - skipping data migration';
    RETURN;
  END IF;

  -- Get the first admin user
  SELECT u.id INTO admin_user_id
  FROM users u
  INNER JOIN roles r ON u.role_id = r.id
  WHERE r.name = 'admin'
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    RAISE WARNING 'No admin user found. Skipping data migration.';
    RETURN;
  END IF;

  -- Migrate vehicles that have a group_id to the new vehicle_group_assignments
  EXECUTE format('
    INSERT INTO vehicle_group_assignments (vehicle_id, group_id, assigned_at, assigned_by)
    SELECT 
      id as vehicle_id,
      group_id,
      created_at as assigned_at,
      %L as assigned_by
    FROM vehicles
    WHERE group_id IS NOT NULL
  ', admin_user_id);

  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % vehicle group assignments from vehicles.group_id', migrated_count;
END $$;

-- Step 3: Remove the group_id column from vehicles table (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE vehicles DROP COLUMN group_id;
    RAISE NOTICE 'Removed group_id column from vehicles table';
  ELSE
    RAISE NOTICE 'vehicles.group_id column does not exist - nothing to remove';
  END IF;
END $$;

-- Step 4: Verification
DO $$
DECLARE
  assignment_count INTEGER;
  vehicle_count INTEGER;
  has_group_id BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO assignment_count FROM vehicle_group_assignments;
  SELECT COUNT(*) INTO vehicle_count FROM vehicles;
  
  -- Check if group_id still exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'group_id'
  ) INTO has_group_id;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total vehicles: %', vehicle_count;
  RAISE NOTICE 'Vehicles with group assignments: %', assignment_count;
  RAISE NOTICE 'Vehicles without group assignments: %', (vehicle_count - assignment_count);
  RAISE NOTICE 'vehicles.group_id exists: %', has_group_id;
  RAISE NOTICE '========================================';
  
  IF assignment_count = 0 AND vehicle_count > 0 THEN
    RAISE NOTICE '⚠️  WARNING: You have vehicles but no group assignments!';
    RAISE NOTICE '   All new vehicles will be assigned to "Default Group" automatically.';
  END IF;
END $$;

COMMIT;

-- ================================================
-- Post-Migration Verification Queries
-- ================================================

-- Check the new table structure
SELECT 
  vga.id,
  v.license_plate,
  vg.name as group_name,
  vga.assigned_at,
  u.username as assigned_by_username
FROM vehicle_group_assignments vga
INNER JOIN vehicles v ON vga.vehicle_id = v.id
INNER JOIN vehicle_groups vg ON vga.group_id = vg.id
INNER JOIN users u ON vga.assigned_by = u.id
ORDER BY vga.assigned_at DESC
LIMIT 10;

-- Check vehicles without group assignments
SELECT 
  id,
  license_plate,
  make,
  model
FROM vehicles v
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_group_assignments vga 
  WHERE vga.vehicle_id = v.id
);
