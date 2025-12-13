import { db } from "@/drizzle/db";
import { roles, users } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { createVehicle, listVehicles } from "@/lib/services/vehicle.service";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const vehicleAttachmentSchema = z.object({
  url: z.string().url(),
  fileName: z.string(),
  fileSize: z.number(),
  contentType: z.string(),
});

const vehicleCreateSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  make: z.string().min(1),
  model: z.string().min(1),
  licensePlate: z.string().min(1),
  vin: z.string().min(1),
  status: z
    .enum([
      "available",
      "assigned",
      "maintenance",
      "temporarily_assigned",
      "leased_out",
      "retired",
      "sold",
    ])
    .default("available"),
  ownership: z.enum(["owned", "external", "leased_out"]),
  ownerCompany: z.string().optional().nullable(),
  fuelType: z.enum(["petrol", "diesel", "electric", "hybrid", "lpg"]),
  transmission: z.enum(["manual", "automatic", "cvt", "semi_automatic"]),
  engineSizeL: z.string().optional().nullable(),
  odometer: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  lastServiceDate: z.string().optional().nullable(),
  nextServiceDue: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  attachments: z.array(vehicleAttachmentSchema).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      ownership: searchParams.get("ownership") || undefined,
      limit: parseInt(searchParams.get("limit") || "10"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    const result = await listVehicles(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
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

    // Check user role
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
    const validatedData = vehicleCreateSchema.parse(body);

    const { attachments, ...vehicleData } = validatedData;
    const vehicle = await createVehicle(
      vehicleData,
      session.user.id,
      attachments
    );
    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating vehicle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
