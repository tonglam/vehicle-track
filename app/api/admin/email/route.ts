import { requireAuth } from "@/lib/auth-utils";
import {
  createOrUpdateEmailConfig,
  getEmailConfigForUser,
} from "@/lib/services/email-config.service";
import { emailConfigSchema } from "@/lib/validations/email-config.validation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    // Check authentication and role
    const { user } = await requireAuth();

    // Check role (admin or manager only)
    if (!["admin", "manager"].includes(user.roleName)) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Manager role required" },
        { status: 403 }
      );
    }

    console.log("📧 Fetching email config for user:", user.id);

    // Fetch email configuration
    const config = await getEmailConfigForUser(user.id);

    if (!config) {
      console.log("No email config found for user");
      return NextResponse.json({ config: null });
    }

    console.log("✅ Email config found");
    return NextResponse.json({ config });
  } catch (error: any) {
    console.error("❌ Error fetching email config:", error);
    return NextResponse.json(
      { error: "Failed to fetch email configuration", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and role
    const { user } = await requireAuth();

    // Check role (admin or manager only)
    if (!["admin", "manager"].includes(user.roleName)) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Manager role required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log("📧 Saving email config for user:", user.id);

    // Validate input
    const validatedData = emailConfigSchema.parse(body);

    // Save configuration (password will be encrypted in service)
    const savedConfig = await createOrUpdateEmailConfig(user.id, validatedData);

    console.log("✅ Email config saved successfully");

    return NextResponse.json({
      success: true,
      config: {
        ...savedConfig,
        smtpPassword: undefined, // Don't return password
      },
    });
  } catch (error: any) {
    console.error("❌ Error saving email config:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save email configuration", message: error.message },
      { status: 500 }
    );
  }
}
