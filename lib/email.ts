import { Resend } from "resend";

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendPasswordResetEmailParams {
  to: string;
  resetUrl: string;
  userName?: string;
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  userName,
}: SendPasswordResetEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Vehicle Track <noreply@yourdomain.com>",
      to: [to],
      subject: "Reset Your Password - Vehicle Track",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
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
              .header {
                text-align: center;
                margin-bottom: 32px;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 8px;
              }
              h1 {
                color: #111827;
                font-size: 24px;
                font-weight: 600;
                margin: 0 0 16px 0;
              }
              p {
                color: #4b5563;
                margin: 0 0 16px 0;
              }
              .button {
                display: inline-block;
                background-color: #2563eb;
                color: #ffffff !important;
                text-decoration: none;
                padding: 12px 32px;
                border-radius: 6px;
                font-weight: 500;
                margin: 24px 0;
              }
              .button:hover {
                background-color: #1d4ed8;
              }
              .footer {
                margin-top: 32px;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
              }
              .warning {
                background-color: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 12px;
                margin: 16px 0;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🚗 Vehicle Track</div>
              </div>
              
              <h1>Reset Your Password</h1>
              
              <p>Hello${userName ? ` ${userName}` : ""},</p>
              
              <p>We received a request to reset your password for your Vehicle Track account.</p>
              
              <p>Click the button below to create a new password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                  <li>This link expires in 1 hour</li>
                  <li>This link can only be used once</li>
                  <li>If you didn't request this, ignore this email</li>
                </ul>
              </div>
              
              <div class="footer">
                <p><strong>Didn't request a password reset?</strong></p>
                <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                
                <p style="margin-top: 24px;">
                  <small>
                    © ${new Date().getFullYear()} Vehicle Track. All rights reserved.
                  </small>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      // Plain text version for email clients that don't support HTML
      text: `
Reset Your Password

Hello${userName ? ` ${userName}` : ""},

We received a request to reset your password for your Vehicle Track account.

Click the link below to create a new password:
${resetUrl}

Security Notice:
- This link expires in 1 hour
- This link can only be used once
- If you didn't request this, ignore this email

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} Vehicle Track. All rights reserved.
      `.trim(),
    });

    if (error) {
      console.error("❌ Failed to send email:", error);
      throw new Error(`Email sending failed: ${error.message}`);
    }

    console.log("✅ Password reset email sent successfully to:", to);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Email error:", error);
    throw error;
  }
}

// Optional: Send welcome email
export async function sendWelcomeEmail({
  to,
  userName,
}: {
  to: string;
  userName: string;
}) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Vehicle Track <noreply@yourdomain.com>",
      to: [to],
      subject: "Welcome to Vehicle Track!",
      html: `
        <h1>Welcome to Vehicle Track, ${userName}!</h1>
        <p>Your account has been created successfully.</p>
        <p>You can now log in and start managing your vehicles.</p>
      `,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
}
