import { db } from "@/drizzle/db";
import { agreements, roles, users } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import {
  deleteFile,
  generateAgreementSupportingDocPath,
  STORAGE_BUCKET_NAME,
  uploadFile,
} from "@/lib/storage";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

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

  return { status: 200 as const, userId: session.user.id } as const;
}

async function agreementExists(agreementId: string) {
  const [record] = await db
    .select({ id: agreements.id })
    .from(agreements)
    .where(eq(agreements.id, agreementId))
    .limit(1);
  return record;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authorize(request);
  if (authResult.status !== 200) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id: agreementId } = await params;
  if (!agreementId) {
    return NextResponse.json({ error: "Agreement ID is required" }, { status: 400 });
  }

  const agreement = await agreementExists(agreementId);
  if (!agreement) {
    return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const allowedTypes = [
    "image/",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (
    !allowedTypes.some((type) =>
      type.endsWith("/") ? file.type.startsWith(type) : file.type === type
    )
  ) {
    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 400 }
    );
  }

  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File exceeds 20MB limit" },
      { status: 400 }
    );
  }

  const storagePath = generateAgreementSupportingDocPath(agreementId, file.name);
  const { url, error } = await uploadFile(
    file,
    STORAGE_BUCKET_NAME,
    storagePath,
    true
  );

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({
    url,
    path: storagePath,
    fileName: file.name,
    fileSize: file.size,
    contentType: file.type,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authorize(request);
  if (authResult.status !== 200) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id: agreementId } = await params;
  if (!agreementId) {
    return NextResponse.json({ error: "Agreement ID is required" }, { status: 400 });
  }

  const agreement = await agreementExists(agreementId);
  if (!agreement) {
    return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  }

  const body = await request.json();
  const path = body?.path as string | undefined;

  if (!path || typeof path !== "string") {
    return NextResponse.json({ error: "File path is required" }, { status: 400 });
  }

  const expectedPrefix = `agreements/${agreementId}/supporting/`;
  if (!path.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  const { success, error } = await deleteFile(STORAGE_BUCKET_NAME, path, true);
  if (!success) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
