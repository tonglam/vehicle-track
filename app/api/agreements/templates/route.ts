import { authorizeApiRequest } from "@/lib/api-authorization";
import { AGREEMENT_EDITOR_ROLES } from "@/lib/authorization-policy";
import { createAgreementTemplate } from "@/lib/services/agreement.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const templateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  contentRichtext: z.string().min(1, "Content is required"),
  active: z.boolean().default(true),
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
    const payload = templateSchema.parse(body);

    const template = await createAgreementTemplate({
      ...payload,
      userId: authorization.user.id,
    });

    return NextResponse.json({ template }, { status: 201 });
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

    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
