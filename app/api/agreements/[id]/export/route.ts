import { db } from "@/drizzle/db";
import { agreements } from "@/drizzle/schema";
import { authorizeApiRequest } from "@/lib/api-authorization";
import { AGREEMENT_EDITOR_ROLES } from "@/lib/authorization-policy";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const exportSchema = z.object({
  format: z.enum(["zip", "pdf"]),
  sendEmail: z.boolean().optional(),
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
  const parsed = exportSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const [exists] = await db
    .select({ id: agreements.id })
    .from(agreements)
    .where(eq(agreements.id, id))
    .limit(1);

  if (!exists) {
    return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  }

  // TODO: replace with PDF/ZIP generation and optional email delivery
  return NextResponse.json({ success: true, format: parsed.data.format });
}
