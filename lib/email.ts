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

interface AgreementInviteEmail {
  to: string;
  driverName: string;
  requesterName: string;
  vehicleName: string;
  licensePlate: string;
  templateTitle: string;
  signingLink: string;
}

export function buildAgreementInviteEmail({
  driverName,
  requesterName,
  vehicleName,
  licensePlate,
  templateTitle,
  signingLink,
}: Omit<AgreementInviteEmail, "to">) {
  const subject = `${templateTitle} ready for your signature`;
  const greetingName = driverName || "there";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #111827;
            background-color: #f9fafb;
            margin: 0;
            padding: 24px;
          }
          .card {
            max-width: 640px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            padding: 32px;
            border: 1px solid #e5e7eb;
          }
          .cta {
            display: inline-block;
            padding: 12px 28px;
            margin: 24px 0;
            background-color: #2563eb;
            color: #ffffff !important;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
          }
          p {
            line-height: 1.6;
            margin: 0 0 16px 0;
            color: #374151;
          }
          .details {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 16px;
            background-color: #f9fafb;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <p>Hi ${greetingName},</p>
          <p><strong>${requesterName || "A fleet manager"}</strong> just prepared a vehicle handover agreement for you.</p>
          <div class="details">
            <p style="margin: 0 0 8px 0;"><strong>Agreement:</strong> ${templateTitle}</p>
            <p style="margin: 0 0 8px 0;"><strong>Vehicle:</strong> ${vehicleName} (${licensePlate})</p>
            <p style="margin: 0;">Review the terms, add any required comments, and sign digitally in a single step.</p>
          </div>
          <p>Use the secure link below to open the agreement. The signing flow works on desktop or mobile and only takes a minute.</p>
          <p style="text-align: center;">
            <a class="cta" href="${signingLink}" target="_blank" rel="noreferrer">Review & Sign Agreement</a>
          </p>
          <p>If you have any questions, reply directly to this email and ${requesterName || "the team"} will help.</p>
          <p style="margin-top: 32px;">Thank you,<br/>Vehicle Track</p>
        </div>
      </body>
    </html>
  `;

  const text = `Hi ${greetingName},

${requesterName || "A fleet manager"} shared a vehicle agreement for ${vehicleName} (${licensePlate}).
Open the link below to review and sign:
${signingLink}

Thank you,
Vehicle Track`;

  return { subject, html, text };
}

export async function sendAgreementInviteEmail({
  to,
  ...rest
}: AgreementInviteEmail) {
  const { subject, html, text } = buildAgreementInviteEmail(rest);
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Vehicle Track <noreply@vehicletrack.app>",
    to: [to],
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(error.message || "Unable to send agreement invite");
  }

  return data;
}

interface AgreementTerminationEmail {
  to: string;
  driverName: string;
  requesterName: string;
  vehicleName: string;
  licensePlate: string;
  templateTitle: string;
  reason?: string;
}

export async function sendAgreementTerminationEmail({
  to,
  driverName,
  requesterName,
  vehicleName,
  licensePlate,
  templateTitle,
  reason,
}: AgreementTerminationEmail) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background-color: #f9fafb; margin: 0; padding: 24px; }
          .card { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e5e7eb; }
          h1 { font-size: 20px; color: #0f172a; }
          p { line-height: 1.6; color: #374151; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Agreement Terminated</h1>
          <p>Hi ${driverName || "there"},</p>
          <p>${requesterName || "A fleet manager"} has terminated the agreement "${templateTitle}" for ${vehicleName} (${licensePlate}).</p>
          ${reason ? `<p><strong>Reason provided:</strong> ${reason}</p>` : ""}
          <p>If you have any questions, please reply to this email.</p>
        </div>
      </body>
    </html>
  `;
  const text = `Agreement Terminated\n\n${requesterName || "A fleet manager"} has terminated the agreement "${templateTitle}" for ${vehicleName} (${licensePlate}).${reason ? `\nReason: ${reason}` : ""}`;

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Vehicle Track <noreply@vehicletrack.app>",
    to: [to],
    subject: "Agreement terminated",
    html,
    text,
  });

  if (error) {
    throw new Error(error.message || "Unable to send termination email");
  }
}
