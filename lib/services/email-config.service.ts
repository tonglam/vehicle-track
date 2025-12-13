import { db } from "@/drizzle/db";
import { emailConfigs } from "@/drizzle/schema";
import type { EmailConfigForm } from "@/types";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

// Encryption configuration
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY;
const ALGORITHM = "aes-256-cbc";

if (!ENCRYPTION_KEY) {
  throw new Error(
    "EMAIL_ENCRYPTION_KEY is not defined. Generate one with: openssl rand -hex 32"
  );
}

// Ensure key is correct length (32 bytes)
const keyBuffer = Buffer.from(ENCRYPTION_KEY, "hex");
if (keyBuffer.length !== 32) {
  throw new Error(
    "EMAIL_ENCRYPTION_KEY must be 32 bytes (64 hex characters). Generate with: openssl rand -hex 32"
  );
}

/**
 * Encrypt a password for storage
 */
export function encryptPassword(password: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt a password from storage
 */
export function decryptPassword(encryptedPassword: string): string {
  const parts = encryptedPassword.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted password format");
  }
  const iv = Buffer.from(parts[0]!, "hex");
  const encryptedText = parts[1]!;
  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Get email configuration for a user
 */
export async function getEmailConfigForUser(userId: string) {
  const configs = await db
    .select()
    .from(emailConfigs)
    .where(eq(emailConfigs.userId, userId))
    .limit(1);

  if (configs.length === 0) {
    return null;
  }

  const config = configs[0]!;

  // Decrypt password for editing
  try {
    const decryptedPassword = decryptPassword(config.smtpPasswordEnc);
    return {
      ...config,
      smtpPassword: decryptedPassword,
    };
  } catch (error) {
    console.error("Failed to decrypt password:", error);
    throw new Error("Failed to decrypt email configuration");
  }
}

/**
 * Create or update email configuration
 */
export async function createOrUpdateEmailConfig(
  userId: string,
  data: EmailConfigForm
) {
  try {
    // Encrypt the password
    const encryptedPassword = encryptPassword(data.smtpPassword);

    // Check if config exists
    const existing = await db
      .select()
      .from(emailConfigs)
      .where(eq(emailConfigs.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing config
      const updated = await db
        .update(emailConfigs)
        .set({
          smtpHost: data.smtpHost,
          smtpPort: data.smtpPort,
          smtpUsername: data.smtpUsername,
          smtpPasswordEnc: encryptedPassword,
          fromEmail: data.fromEmail,
          fromName: data.fromName,
          active: data.active,
          updatedAt: new Date(),
        })
        .where(eq(emailConfigs.id, existing[0]!.id))
        .returning();

      return updated[0];
    } else {
      // Create new config
      const newConfig = await db
        .insert(emailConfigs)
        .values({
          userId,
          smtpHost: data.smtpHost,
          smtpPort: data.smtpPort,
          smtpUsername: data.smtpUsername,
          smtpPasswordEnc: encryptedPassword,
          fromEmail: data.fromEmail,
          fromName: data.fromName,
          active: data.active,
        })
        .returning();

      return newConfig[0];
    }
  } catch (error) {
    console.error("Error saving email config:", error);
    throw error;
  }
}

/**
 * Test SMTP connection with given configuration
 */
export async function testEmailConnection(config: {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: config.smtpUsername,
        pass: config.smtpPassword,
      },
      // Timeout settings
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 5000,
    });

    // Verify connection
    await transporter.verify();

    return { success: true };
  } catch (error: any) {
    console.error("SMTP connection test failed:", error);

    // Parse common SMTP errors
    let errorMessage = "Connection failed";

    if (error.code === "EAUTH") {
      errorMessage = "Authentication failed. Check your username and password.";
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = "Connection refused. Check the host and port.";
    } else if (error.code === "ETIMEDOUT") {
      errorMessage = "Connection timeout. The server may be unreachable.";
    } else if (error.responseCode === 535) {
      errorMessage = "Authentication failed (Invalid credentials).";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Send a test email
 */
export async function sendTestEmail(
  config: {
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  },
  toEmail: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUsername,
        pass: config.smtpPassword,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
    });

    // Send test email
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: toEmail,
      subject: "Test Email - Vehicle Track",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background-color: #ffffff;
                border-radius: 8px;
                padding: 32px;
                border: 1px solid #e5e7eb;
              }
              .success-icon {
                font-size: 48px;
                text-align: center;
                margin-bottom: 16px;
              }
              h1 {
                color: #10b981;
                text-align: center;
                margin-bottom: 24px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success-icon">✅</div>
              <h1>Email Configuration Test Successful!</h1>
              <p>Congratulations! Your SMTP configuration is working correctly.</p>
              <p><strong>Configuration Details:</strong></p>
              <ul>
                <li>SMTP Host: ${config.smtpHost}</li>
                <li>SMTP Port: ${config.smtpPort}</li>
                <li>From: ${config.fromName} &lt;${config.fromEmail}&gt;</li>
              </ul>
              <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
                This is a test email from Vehicle Track. You can now save your configuration and start sending emails.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
Test Email - Vehicle Track

✅ Email Configuration Test Successful!

Congratulations! Your SMTP configuration is working correctly.

Configuration Details:
- SMTP Host: ${config.smtpHost}
- SMTP Port: ${config.smtpPort}
- From: ${config.fromName} <${config.fromEmail}>

This is a test email from Vehicle Track. You can now save your configuration and start sending emails.
      `.trim(),
    });

    console.log("✅ Test email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Failed to send test email:", error);

    // Parse error
    let errorMessage = "Failed to send test email";

    if (error.code === "EAUTH") {
      errorMessage = "Authentication failed. Check your credentials.";
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = "Connection refused. Check the host and port.";
    } else if (error.responseCode === 535) {
      errorMessage = "Authentication failed (Invalid credentials).";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
}
