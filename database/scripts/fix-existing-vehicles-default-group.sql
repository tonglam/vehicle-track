-- ============================================================================
-- ONE-TIME MIGRATION: Assign existing vehicles to default group
-- ============================================================================
-- Purpose: Fix existing vehicles that don't have a group assignment
-- Run in: Supabase SQL Editor
-- Frequency: Once only
-- After running: Delete this file or move to an archive folder
--
-- NOTE: Future vehicles will automatically be assigned to default group
--       via application code (vehicle.service.ts). This script only fixes
--       existing data.
-- ============================================================================

BEGIN;

-- Step 1: Create default group if it doesn't exist
INSERT INTO vehicle_groups (id, name, description, type, created_by, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Default Group',
  'Default group for unassigned vehicles',
  'general',
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_groups WHERE name = 'Default Group'
);

-- Step 2: Show vehicles that will be updated (before update)
SELECT 
  'Vehicles to be updated:' as status,
  COUNT(*) as count
FROM vehicles
WHERE group_id IS NULL;

-- Step 3: Update all vehicles without a group
UPDATE vehicles
SET 
  group_id = (SELECT id FROM vehicle_groups WHERE name = 'Default Group'),
  updated_at = NOW()
WHERE group_id IS NULL;

-- Step 4: Verify results
SELECT 
  '=== Verification Results ===' as status,
  COUNT(*) as total_vehicles,
  COUNT(group_id) as vehicles_with_group,
  COUNT(*) FILTER (WHERE group_id IS NULL) as vehicles_without_group
FROM vehicles;

-- Step 5: Show vehicles by group
SELECT 
  '=== Vehicles by Group ===' as status,
  COALESCE(vg.name, 'No Group') as group_name,
  COUNT(v.id) as vehicle_count
FROM vehicles v
LEFT JOIN vehicle_groups vg ON v.group_id = vg.id
GROUP BY vg.name
ORDER BY vehicle_count DESC;

COMMIT;

-- ============================================================================
-- Expected Result:
-- - All vehicles should now have a group_id
-- - vehicles_without_group should be 0
-- - You should see "Default Group" in the group list
-- ============================================================================
