import { db } from "@/drizzle/db";
import {
  agreements,
  agreementTemplates,
  drivers,
  vehicles,
} from "@/drizzle/schema";
import { authorizeApiRequest } from "@/lib/api-authorization";
import {
  AGREEMENT_EDITOR_ROLES,
  canTransitionAgreement,
} from "@/lib/authorization-policy";
import { sendAgreementTerminationEmail } from "@/lib/email";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const terminateSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await authorizeApiRequest(
    request.headers,
    AGREEMENT_EDITOR_ROLES,
  );
  if (authResult.status !== 200) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Agreement ID is required" },
      { status: 400 },
    );
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = terminateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const [agreementRow] = await db
    .select({
      id: agreements.id,
      status: agreements.status,
      driverId: agreements.signedByDriverId,
      vehicleName: vehicles.make,
      vehicleModel: vehicles.model,
      vehicleYear: vehicles.year,
      licensePlate: vehicles.licensePlate,
      templateTitle: agreementTemplates.title,
    })
    .from(agreements)
    .leftJoin(vehicles, eq(agreements.vehicleId, vehicles.id))
    .leftJoin(
      agreementTemplates,
      eq(agreements.templateId, agreementTemplates.id),
    )
    .where(eq(agreements.id, id))
    .limit(1);

  if (!agreementRow) {
    return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  }

  if (!canTransitionAgreement(agreementRow.status, "terminated")) {
    return NextResponse.json(
      { error: `Agreement cannot be terminated from ${agreementRow.status}` },
      { status: 400 },
    );
  }

  await db
    .update(agreements)
    .set({ status: "terminated", updatedAt: new Date() })
    .where(eq(agreements.id, id));

  if (agreementRow.driverId) {
    const [driver] = await db
      .select({
        email: drivers.email,
        firstName: drivers.firstName,
        lastName: drivers.lastName,
      })
      .from(drivers)
      .where(eq(drivers.id, agreementRow.driverId))
      .limit(1);

    if (driver?.email) {
      await sendAgreementTerminationEmail({
        to: driver.email,
        driverName:
          `${driver.firstName ?? ""} ${driver.lastName ?? ""}`.trim() ||
          "Driver",
        requesterName:
          `${authResult.user.firstName ?? ""} ${authResult.user.lastName ?? ""}`.trim() ||
          authResult.user.email,
        vehicleName:
          `${agreementRow.vehicleYear ?? ""} ${agreementRow.vehicleName ?? ""} ${agreementRow.vehicleModel ?? ""}`.trim() ||
          "Vehicle",
        licensePlate: agreementRow.licensePlate ?? "—",
        templateTitle: agreementRow.templateTitle ?? "Vehicle Rental Agreement",
        reason: parsed.data.reason,
      });
    }
  }

  return NextResponse.json({ success: true });
}
