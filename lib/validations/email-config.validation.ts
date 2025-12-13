import { z } from "zod";

// Validation schema for email configuration
export const emailConfigSchema = z.object({
  smtpHost: z
    .string()
    .min(1, "SMTP host is required")
    .max(255, "SMTP host is too long")
    .refine(
      (host) => {
        // Basic hostname validation
        const hostnameRegex =
          /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return hostnameRegex.test(host);
      },
      { message: "Invalid SMTP host format" }
    ),
  smtpPort: z
    .number()
    .int("Port must be an integer")
    .min(1, "Port must be between 1 and 65535")
    .max(65535, "Port must be between 1 and 65535"),
  smtpUsername: z
    .string()
    .min(1, "SMTP username is required")
    .max(255, "SMTP username is too long"),
  smtpPassword: z.string().min(1, "SMTP password is required"),
  fromEmail: z
    .string()
    .min(1, "From email is required")
    .email("Invalid email address")
    .max(255, "Email is too long"),
  fromName: z
    .string()
    .min(1, "From name is required")
    .max(100, "From name is too long"),
  active: z.boolean(),
});

export type EmailConfigInput = z.infer<typeof emailConfigSchema>;
