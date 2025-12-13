import { db } from "@/drizzle/db";
import { roles, users } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import {
  createInspection,
  listInspections,
} from "@/lib/services/inspection.service";
import { createInspectionPayloadSchema } from "@/lib/validations/inspection.validation";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const vehicleId = searchParams.get("vehicleId") || undefined;
    const limitParam = Number.parseInt(searchParams.get("limit") || "10", 10);
    const limit = Number.isNaN(limitParam)
      ? 10
      : Math.min(Math.max(limitParam, 1), 50);

    const { inspections, total } = await listInspections({ vehicleId, limit });
    return NextResponse.json({ inspections, total });
  } catch (error) {
    console.error("Error fetching inspections:", error);
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

    const [user] = await db
      .select({ roleName: roles.name, active: users.active })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user || !user.active || !["admin", "manager"].includes(user.roleName)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const payload = createInspectionPayloadSchema.parse(body);
    const inspection = await createInspection(
      {
        ...payload,
        additionalNotes: payload.additionalNotes ?? undefined,
      },
      session.user.id,
      payload.images ?? []
    );

    return NextResponse.json({ inspection }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error creating inspection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
