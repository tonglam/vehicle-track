import { db } from "@/drizzle/db";
import { agreements } from "@/drizzle/schema";
import { authorizeApiRequest } from "@/lib/api-authorization";
import { AGREEMENT_EDITOR_ROLES } from "@/lib/authorization-policy";
import {
  listAgreementSupportingDocs,
  deleteFile,
  STORAGE_BUCKET_NAME,
} from "@/lib/storage";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function DELETE(
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

  const deleted = await db
    .delete(agreements)
    .where(eq(agreements.id, id))
    .returning({ id: agreements.id });

  if (!deleted.length) {
    return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  }

  const docs = await listAgreementSupportingDocs(id);
  const deleteResults = await Promise.all(
    docs.map((doc) => deleteFile(STORAGE_BUCKET_NAME, doc.path, true)),
  );
  deleteResults.forEach((result) => {
    if (!result.success) {
      console.error("Failed to delete supporting document", result.error);
    }
  });

  return NextResponse.json({ success: true });
}

const updateContentSchema = z.object({
  content: z.string().min(1, "Agreement content is required"),
});

export async function PATCH(
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
  const parsed = updateContentSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await db
    .update(agreements)
    .set({ finalContentRichtext: parsed.data.content, updatedAt: new Date() })
    .where(eq(agreements.id, id))
    .returning({ id: agreements.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
