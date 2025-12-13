import { db } from "@/drizzle/db";
import {
  vehicleGroupAssignments,
  vehicleGroups,
  vehicles,
} from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { and, desc, eq, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const excludeGroupId = searchParams.get("excludeGroupId");

    // Find Default Group
    const [defaultGroup] = await db
      .select()
      .from(vehicleGroups)
      .where(eq(vehicleGroups.name, "Default Group"))
      .limit(1);

    if (!defaultGroup) {
      return NextResponse.json({ vehicles: [] });
    }

    // Get all vehicles NOT in Default Group
    let query = db
      .select({
        id: vehicles.id,
        year: vehicles.year,
        make: vehicles.make,
        model: vehicles.model,
        licensePlate: vehicles.licensePlate,
        vin: vehicles.vin,
        status: vehicles.status,
        ownership: vehicles.ownership,
        ownerCompany: vehicles.ownerCompany,
        fuelType: vehicles.fuelType,
        transmission: vehicles.transmission,
        engineSizeL: vehicles.engineSizeL,
        odometer: vehicles.odometer,
        purchaseDate: vehicles.purchaseDate,
        lastServiceDate: vehicles.lastServiceDate,
        nextServiceDue: vehicles.nextServiceDue,
        notes: vehicles.notes,
        createdAt: vehicles.createdAt,
        updatedAt: vehicles.updatedAt,
        updatedBy: vehicles.updatedBy,
        groupName: vehicleGroups.name,
      })
      .from(vehicles)
      .innerJoin(
        vehicleGroupAssignments,
        eq(vehicles.id, vehicleGroupAssignments.vehicleId)
      )
      .innerJoin(
        vehicleGroups,
        eq(vehicleGroupAssignments.groupId, vehicleGroups.id)
      )
      .where(ne(vehicleGroupAssignments.groupId, defaultGroup.id))
      .$dynamic();

    // Optionally exclude a specific group (useful when viewing a group's detail page)
    if (excludeGroupId) {
      query = query.where(
        and(
          ne(vehicleGroupAssignments.groupId, defaultGroup.id),
          ne(vehicleGroupAssignments.groupId, excludeGroupId)
        )
      );
    }

    const nonDefaultGroupVehicles = await query.orderBy(
      desc(vehicles.updatedAt)
    );

    return NextResponse.json({ vehicles: nonDefaultGroupVehicles });
  } catch (error) {
    console.error("Error fetching vehicles from non-default groups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
