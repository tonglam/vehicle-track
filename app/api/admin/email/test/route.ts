import { requireAuth } from "@/lib/auth-utils";
import { sendTestEmail } from "@/lib/services/email-config.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const testEmailSchema = z.object({
  action: z.literal("send"),
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.number().min(1).max(65535),
  smtpUsername: z.string().min(1, "SMTP username is required"),
  smtpPassword: z.string().min(1, "SMTP password is required"),
  fromEmail: z.string().email("Valid from email is required"),
  fromName: z.string().min(1, "From name is required"),
  toEmail: z.string().email("Valid test email is required"),
});

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
    console.log("📧 Testing email configuration for user:", user.id);

    // Validate input
    const validatedData = testEmailSchema.parse(body);

    // Send test email
    const result = await sendTestEmail(
      {
        smtpHost: validatedData.smtpHost,
        smtpPort: validatedData.smtpPort,
        smtpUsername: validatedData.smtpUsername,
        smtpPassword: validatedData.smtpPassword,
        fromEmail: validatedData.fromEmail,
        fromName: validatedData.fromName,
      },
      validatedData.toEmail
    );

    console.log("✅ Test email sent successfully");

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      details: result,
    });
  } catch (error: any) {
    console.error("❌ Error testing email:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send test email",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
