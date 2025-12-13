import { db } from "@/drizzle/db";
import { roles, users } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import {
  createVehicleGroup,
  listVehicleGroups,
} from "@/lib/services/vehicle-group.service";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const vehicleGroupCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.string().optional(),
  contractId: z.string().optional(),
  areaManagerContact: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const excludeDefault = searchParams.get("excludeDefault") === "true";

    const filters = {
      limit: parseInt(searchParams.get("limit") || "100"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    const result = await listVehicleGroups(filters);

    // Filter out Default Group if requested
    if (excludeDefault) {
      result.groups = result.groups.filter(
        (group) => group.name !== "Default Group"
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching vehicle groups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user role - only admin and manager can create groups
    const [user] = await db
      .select({ roleName: roles.name })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user || !["admin", "manager"].includes(user.roleName)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = vehicleGroupCreateSchema.parse(body);

    const group = await createVehicleGroup(validatedData, session.user.id);
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating vehicle group:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
