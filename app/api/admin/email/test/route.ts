import { requireAuth } from "@/lib/auth-utils";
import {
  sendTestEmail,
  testEmailConnection,
} from "@/lib/services/email-config.service";
import { emailConfigSchema } from "@/lib/validations/email-config.validation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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
    const { action = "connection", ...configData } = body;

    console.log("🧪 Testing email configuration:", action);

    // Validate the configuration data
    const validatedConfig = emailConfigSchema.parse(configData);

    if (action === "connection") {
      // Test SMTP connection only
      console.log("Testing SMTP connection...");
      const result = await testEmailConnection({
        smtpHost: validatedConfig.smtpHost,
        smtpPort: validatedConfig.smtpPort,
        smtpUsername: validatedConfig.smtpUsername,
        smtpPassword: validatedConfig.smtpPassword,
      });

      if (result.success) {
        console.log("✅ SMTP connection test successful");
        return NextResponse.json({
          success: true,
          message: "SMTP connection successful",
        });
      } else {
        console.log("❌ SMTP connection test failed:", result.error);
        return NextResponse.json(
          {
            success: false,
            error: result.error,
          },
          { status: 400 }
        );
      }
    } else if (action === "send") {
      // Test by sending an actual email
      console.log("Sending test email to:", user.email);
      const result = await sendTestEmail(
        {
          smtpHost: validatedConfig.smtpHost,
          smtpPort: validatedConfig.smtpPort,
          smtpUsername: validatedConfig.smtpUsername,
          smtpPassword: validatedConfig.smtpPassword,
          fromEmail: validatedConfig.fromEmail,
          fromName: validatedConfig.fromName,
        },
        user.email
      );

      if (result.success) {
        console.log("✅ Test email sent successfully:", result.messageId);
        return NextResponse.json({
          success: true,
          message: `Test email sent successfully to ${user.email}`,
          messageId: result.messageId,
        });
      } else {
        console.log("❌ Test email failed:", result.error);
        return NextResponse.json(
          {
            success: false,
            error: result.error,
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'connection' or 'send'" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("❌ Error testing email:", error);

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
      { error: "Failed to test email configuration", message: error.message },
      { status: 500 }
    );
  }
}
