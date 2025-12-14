import { db } from "@/drizzle/db";
import { agreements, inspections, roles, users } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  inspectionId: z.string().uuid(),
  reason: z.string().max(1000).optional(),
});

async function authorize(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return { status: 401 as const, error: "Unauthorized" } as const;
  }

  const [user] = await db
    .select({ roleName: roles.name })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user || !["admin", "manager"].includes(user.roleName)) {
    return { status: 403 as const, error: "Insufficient permissions" } as const;
  }

  return { status: 200 as const } as const;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authorize(request);
  if (authResult.status !== 200) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Agreement ID is required" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { inspectionId } = parsed.data;

  const [agreementRow] = await db
    .select({ id: agreements.id, vehicleId: agreements.vehicleId, currentInspectionId: agreements.inspectionId })
    .from(agreements)
    .where(eq(agreements.id, id))
    .limit(1);

  if (!agreementRow) {
    return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  }

  if (agreementRow.currentInspectionId === inspectionId) {
    return NextResponse.json(
      { error: "Agreement already linked to this inspection" },
      { status: 400 }
    );
  }

  const [inspectionRow] = await db
    .select({ id: inspections.id, vehicleId: inspections.vehicleId })
    .from(inspections)
    .where(eq(inspections.id, inspectionId))
    .limit(1);

  if (!inspectionRow) {
    return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
  }

  if (inspectionRow.vehicleId !== agreementRow.vehicleId) {
    return NextResponse.json(
      { error: "Inspection does not belong to the same vehicle" },
      { status: 400 }
    );
  }

  await db
    .update(agreements)
    .set({ inspectionId: inspectionRow.id })
    .where(eq(agreements.id, agreementRow.id));

  return NextResponse.json({ success: true });
}
