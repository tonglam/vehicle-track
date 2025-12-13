-- ================================================
-- Assign Existing Vehicles to Default Group
-- ================================================
-- Run this AFTER running 002-vehicle-group-membership-migration.sql
-- This assigns all existing vehicles to the "Default Group"
-- ================================================

BEGIN;

-- Step 1: Create Default Group if it doesn't exist
INSERT INTO vehicle_groups (id, name, description, type, created_by)
SELECT 
  gen_random_uuid(),
  'Default Group',
  'Default group for unassigned vehicles',
  'general',
  (SELECT users.id FROM users INNER JOIN roles ON users.role_id = roles.id WHERE roles.name = 'admin' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_groups WHERE name = 'Default Group'
);

-- Step 2: Get the Default Group ID and admin user
DO $$
DECLARE
  default_group_id UUID;
  admin_user_id UUID;
  assigned_count INTEGER;
BEGIN
  -- Get Default Group ID
  SELECT id INTO default_group_id 
  FROM vehicle_groups 
  WHERE name = 'Default Group' 
  LIMIT 1;

  IF default_group_id IS NULL THEN
    RAISE EXCEPTION 'Default Group not found after creation!';
  END IF;

  -- Get admin user ID
  SELECT u.id INTO admin_user_id
  FROM users u
  INNER JOIN roles r ON u.role_id = r.id
  WHERE r.name = 'admin'
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'No admin user found!';
  END IF;

  -- Assign all vehicles without a group to Default Group
  INSERT INTO vehicle_group_assignments (vehicle_id, group_id, assigned_at, assigned_by)
  SELECT 
    v.id,
    default_group_id,
    NOW(),
    admin_user_id
  FROM vehicles v
  WHERE NOT EXISTS (
    SELECT 1 FROM vehicle_group_assignments vga 
    WHERE vga.vehicle_id = v.id
  );

  GET DIAGNOSTICS assigned_count = ROW_COUNT;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Assignment Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Assigned % vehicles to Default Group', assigned_count;
  RAISE NOTICE 'Default Group ID: %', default_group_id;
  RAISE NOTICE '========================================';
END $$;

-- Step 3: Verify the assignments
SELECT 
  v.id,
  v.license_plate,
  v.make,
  v.model,
  vg.name as group_name,
  vga.assigned_at,
  u.username as assigned_by
FROM vehicles v
INNER JOIN vehicle_group_assignments vga ON v.id = vga.vehicle_id
INNER JOIN vehicle_groups vg ON vga.group_id = vg.id
INNER JOIN users u ON vga.assigned_by = u.id
ORDER BY v.license_plate;

COMMIT;

-- ================================================
-- Expected Result:
-- You should see all 3 vehicles assigned to "Default Group"
-- ================================================
