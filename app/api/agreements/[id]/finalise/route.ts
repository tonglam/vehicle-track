import { db } from "@/drizzle/db";
import {
  agreements,
  agreementTemplates,
  drivers,
  roles,
  users,
  vehicles,
} from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { sendAgreementInviteEmail } from "@/lib/email";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const finaliseSchema = z.object({
  driverId: z.string().uuid(),
  content: z.string().min(1).optional(),
});

async function authorize(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return { status: 401 as const, error: "Unauthorized" } as const;
  }

  const [user] = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      roleName: roles.name,
      email: users.email,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user || !["admin", "manager"].includes(user.roleName)) {
    return { status: 403 as const, error: "Insufficient permissions" } as const;
  }

  return { status: 200 as const, user } as const;
}

function buildVehicleName(row: {
  year: number | null;
  make: string | null;
  model: string | null;
}) {
  const parts = [] as string[];
  if (row.year) parts.push(String(row.year));
  if (row.make) parts.push(row.make);
  if (row.model) parts.push(row.model);
  return parts.length ? parts.join(" ") : "Vehicle";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authorize(request);
  if (authResult.status !== 200) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Agreement ID is required" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = finaliseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { driverId, content } = parsed.data;

  const [agreementRow] = await db
    .select({
      id: agreements.id,
      status: agreements.status,
      templateTitle: agreementTemplates.title,
      licensePlate: vehicles.licensePlate,
      vehicleYear: vehicles.year,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      signingToken: agreements.signingToken,
      finalContent: agreements.finalContentRichtext,
      templateContent: agreementTemplates.contentRichtext,
    })
    .from(agreements)
    .leftJoin(vehicles, eq(agreements.vehicleId, vehicles.id))
    .leftJoin(
      agreementTemplates,
      eq(agreements.templateId, agreementTemplates.id)
    )
    .where(eq(agreements.id, id))
    .limit(1);

  if (!agreementRow) {
    return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  }

  const [driver] = await db
    .select({
      id: drivers.id,
      firstName: drivers.firstName,
      lastName: drivers.lastName,
      email: drivers.email,
    })
    .from(drivers)
    .where(eq(drivers.id, driverId))
    .limit(1);

  if (!driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  if (!driver.email) {
    return NextResponse.json(
      { error: "Driver must have an email address before sending" },
      { status: 400 }
    );
  }

  const signingToken = agreementRow.signingToken ?? crypto.randomUUID();

  const resolvedContent = content?.trim()?.length
    ? content
    : agreementRow.finalContent ?? agreementRow.templateContent;

  if (!resolvedContent) {
    return NextResponse.json(
      { error: "Agreement content missing. Finalise the template first." },
      { status: 400 }
    );
  }

  await db
    .update(agreements)
    .set({
      finalContentRichtext: resolvedContent,
      signingToken,
      status: "pending_signature",
      signedByDriverId: driver.id,
      updatedAt: new Date(),
    })
    .where(eq(agreements.id, id));

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const signingLink = `${baseUrl.replace(/\/$/, "")}/agreements/driver/sign/${signingToken}`;

  try {
    await sendAgreementInviteEmail({
      to: driver.email,
      driverName: `${driver.firstName ?? ""} ${driver.lastName ?? ""}`.trim(),
      requesterName:
        `${authResult.user.firstName ?? ""} ${authResult.user.lastName ?? ""}`.trim() ||
        authResult.user.email,
      vehicleName: buildVehicleName({
        year: agreementRow.vehicleYear,
        make: agreementRow.vehicleMake,
        model: agreementRow.vehicleModel,
      }),
      licensePlate: agreementRow.licensePlate ?? "—",
      templateTitle: agreementRow.templateTitle ?? "Vehicle Rental Agreement",
      signingLink,
    });
  } catch (error) {
    console.error("Failed to send agreement invite:", error);
    return NextResponse.json(
      { error: "Agreement updated but email failed to send" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, signingLink });
}
