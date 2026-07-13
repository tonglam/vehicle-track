import { authorizeApiRequest } from "@/lib/api-authorization";
import { AGREEMENT_EDITOR_ROLES } from "@/lib/authorization-policy";
import {
  AgreementWorkflowError,
  finaliseAgreementForSigning,
} from "@/lib/services/agreement.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const finaliseSchema = z.object({
  driverId: z.string().uuid(),
  content: z.string().min(1).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeApiRequest(
    request.headers,
    AGREEMENT_EDITOR_ROLES,
  );
  if (authorization.status !== 200) {
    return NextResponse.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Agreement ID is required" },
      { status: 400 },
    );
  }

  const parsed = finaliseSchema.safeParse(
    await request.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await finaliseAgreementForSigning({
      agreementId: id,
      ...parsed.data,
      requester: authorization.user,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof AgreementWorkflowError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Failed to finalise agreement", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
