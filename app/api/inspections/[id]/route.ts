import { db } from "@/drizzle/db";
import { roles, users } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import {
  deleteInspection,
  updateInspection,
  updateInspectionStatus,
} from "@/lib/services/inspection.service";
import { updateInspectionPayloadSchema } from "@/lib/validations/inspection.validation";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["draft", "submitted"]),
});

async function ensureHasInspectionPermissions(userId: string) {
  const [user] = await db
    .select({ roleName: roles.name, active: users.active })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || !user.active || !["admin", "manager"].includes(user.roleName)) {
    return false;
  }

  return true;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await ensureHasInspectionPermissions(session.user.id))) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const payload = updateStatusSchema.parse(body);

    const inspection = await updateInspectionStatus(id, payload.status);
    return NextResponse.json({ inspection });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      const status = error.message === "Inspection not found" ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error("Error updating inspection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await ensureHasInspectionPermissions(session.user.id))) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const payload = updateInspectionPayloadSchema.parse(body);

    const inspection = await updateInspection(id, {
      vehicleId: payload.vehicleId,
      exteriorCondition: payload.exteriorCondition,
      interiorCondition: payload.interiorCondition,
      mechanicalCondition: payload.mechanicalCondition,
      additionalNotes: payload.additionalNotes ?? undefined,
      images: payload.images ?? [],
    }, session.user.id);

    return NextResponse.json({ inspection });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      const status = error.message === "Inspection not found" ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error("Error updating inspection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await ensureHasInspectionPermissions(session.user.id))) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await deleteInspection(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      const status = error.message === "Inspection not found" ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error("Error deleting inspection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
