import { db } from "@/drizzle/db";
import { agreements, roles, users } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const exportSchema = z.object({
  format: z.enum(["zip", "pdf"]),
  sendEmail: z.boolean().optional(),
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

export async function POST(
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

  const payload = await request.json().catch(() => ({}));
  const parsed = exportSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 }
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
