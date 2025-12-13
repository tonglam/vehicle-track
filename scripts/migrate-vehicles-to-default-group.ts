// @ts-nocheck
/**
 * ONE-TIME MIGRATION SCRIPT
 * Run with: npx tsx scripts/migrate-vehicles-to-default-group.ts
 *
 * This script assigns all existing vehicles without a group to "Default Group"
 * After running successfully, you can delete this file.
 */

import { eq, isNull } from "drizzle-orm";
import { db } from "../drizzle/db";
import { vehicleGroups, vehicles } from "../drizzle/schema";

async function migrateVehicles() {
  console.log("🚀 Starting vehicle migration...\n");

  try {
    // Step 1: Check if default group exists
    console.log("Step 1: Checking for Default Group...");
    let [defaultGroup] = await db
      .select()
      .from(vehicleGroups)
      .where(eq(vehicleGroups.name, "Default Group"))
      .limit(1);

    // Step 2: Create default group if it doesn't exist
    if (!defaultGroup) {
      console.log("  → Default Group not found. Creating it...");

      // Get first user to set as creator
      const usersResult = await db.execute(
        "SELECT id FROM users ORDER BY created_at ASC LIMIT 1"
      );
      const firstUserId = usersResult.rows[0]?.id;

      if (!firstUserId) {
        throw new Error(
          "No users found in database. Cannot create default group."
        );
      }

      [defaultGroup] = await db
        .insert(vehicleGroups)
        .values({
          name: "Default Group",
          description: "Default group for unassigned vehicles",
          type: "general",
          createdBy: firstUserId,
        })
        .returning();

      console.log(`  ✅ Default Group created with ID: ${defaultGroup.id}\n`);
    } else {
      console.log(
        `  ✅ Default Group already exists with ID: ${defaultGroup.id}\n`
      );
    }

    // Step 3: Find vehicles without a group
    console.log("Step 2: Finding vehicles without a group...");
    const vehiclesWithoutGroup = await db
      .select({
        id: vehicles.id,
        licensePlate: vehicles.licensePlate,
        make: vehicles.make,
        model: vehicles.model,
      })
      .from(vehicles)
      .where(isNull(vehicles.groupId));

    console.log(
      `  → Found ${vehiclesWithoutGroup.length} vehicle(s) without a group`
    );

    if (vehiclesWithoutGroup.length === 0) {
      console.log(
        "\n✅ No migration needed. All vehicles already have groups!"
      );
      return;
    }

    // Show vehicles that will be updated
    console.log("\n  Vehicles to be updated:");
    vehiclesWithoutGroup.forEach((v) => {
      console.log(`    - ${v.licensePlate} (${v.make} ${v.model})`);
    });

    // Step 4: Assign vehicles to default group
    console.log("\nStep 3: Assigning vehicles to Default Group...");
    const result = await db
      .update(vehicles)
      .set({
        groupId: defaultGroup.id,
        updatedAt: new Date(),
      })
      .where(isNull(vehicles.groupId))
      .returning({
        id: vehicles.id,
        licensePlate: vehicles.licensePlate,
      });

    console.log(`  ✅ Successfully migrated ${result.length} vehicle(s)\n`);

    // Step 5: Verify results
    console.log("Step 4: Verifying results...");
    const totalVehicles = await db.select().from(vehicles);
    const vehiclesWithoutGroupAfter = await db
      .select()
      .from(vehicles)
      .where(isNull(vehicles.groupId));

    console.log("\n=== VERIFICATION RESULTS ===");
    console.log(`  Total vehicles: ${totalVehicles.length}`);
    console.log(
      `  Vehicles with groups: ${totalVehicles.length - vehiclesWithoutGroupAfter.length}`
    );
    console.log(
      `  Vehicles without groups: ${vehiclesWithoutGroupAfter.length}`
    );

    if (vehiclesWithoutGroupAfter.length === 0) {
      console.log("\n✅ SUCCESS! All vehicles now have group assignments.\n");
    } else {
      console.log("\n⚠️  WARNING: Some vehicles still don't have groups.\n");
    }

    // Show vehicles by group
    const vehiclesByGroup = await db.execute(`
      SELECT 
        COALESCE(vg.name, 'No Group') as group_name,
        COUNT(v.id) as vehicle_count
      FROM vehicles v
      LEFT JOIN vehicle_groups vg ON v.group_id = vg.id
      GROUP BY vg.name
      ORDER BY vehicle_count DESC
    `);

    console.log("=== VEHICLES BY GROUP ===");
    vehiclesByGroup.rows.forEach((row: any) => {
      console.log(`  ${row.group_name}: ${row.vehicle_count} vehicle(s)`);
    });

    console.log("\n🎉 Migration completed successfully!");
    console.log("\n💡 You can now delete this script file.\n");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  }
}

// Run the migration
migrateVehicles()
  .then(() => {
    console.log("Exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
