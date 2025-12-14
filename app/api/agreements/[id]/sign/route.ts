import { db } from "@/drizzle/db";
import { agreements } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const signSchema = z.object({
  token: z.string().min(1, "Signing token is required"),
  signature: z.string().min(1, "Signature data is required"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Agreement ID is required" }, { status: 400 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = signSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { token, signature } = parsed.data;

  const [agreementRow] = await db
    .select({ status: agreements.status })
    .from(agreements)
    .where(and(eq(agreements.id, id), eq(agreements.signingToken, token)))
    .limit(1);

  if (!agreementRow) {
    return NextResponse.json(
      { error: "Signing link is invalid or has expired" },
      { status: 404 }
    );
  }

  if (agreementRow.status === "signed") {
    return NextResponse.json(
      { error: "Agreement has already been signed" },
      { status: 400 }
    );
  }

  await db
    .update(agreements)
    .set({
      driverSignatureData: signature,
      status: "signed",
      signedAt: new Date(),
    })
    .where(and(eq(agreements.id, id), eq(agreements.signingToken, token)));

  return NextResponse.json({ success: true });
}
