import { authorizeApiRequest } from "@/lib/api-authorization";
import { AGREEMENT_EDITOR_ROLES } from "@/lib/authorization-policy";
import { createAgreementRecord } from "@/lib/services/agreement.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const agreementCreateSchema = z.object({
  vehicleId: z.string().uuid(),
  inspectionId: z.string().uuid(),
  templateId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const payload = agreementCreateSchema.parse(body);

    const agreement = await createAgreementRecord({
      ...payload,
      userId: authorization.user.id,
    });

    return NextResponse.json({ agreement }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error creating agreement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
