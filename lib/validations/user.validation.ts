import { z } from "zod";

// Australian phone number format validation
// Matches: 0412345678, 02 1234 5678, +61412345678
const phoneRegex = /^(\+61|0)[2-478](\s?\d{4}\s?\d{4}|(?:\d{8}))$/;

// Password strength validation
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

/**
 * Schema for creating a new user
 */
export const createUserSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must not exceed 50 characters")
      .regex(
        /^[a-zA-Z0-9._-]+$/,
        "Username can only contain letters, numbers, dots, underscores, and hyphens"
      ),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .regex(phoneRegex, "Invalid Australian phone number format"),
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name must not exceed 50 characters"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(50, "Last name must not exceed 50 characters"),
    password: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === "") {
            return true;
          }
          return passwordSchema.safeParse(val).success;
        },
        {
          message:
            "Password must be at least 8 characters with uppercase, lowercase, and number",
        }
      ),
    confirmPassword: z.string().optional(),
    roleId: z.string().uuid("Invalid role"),
    active: z.boolean().default(true),
    sendInvite: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    const requiresPassword = !data.sendInvite;

    if (requiresPassword) {
      if (!data.password || data.password.trim() === "") {
        ctx.addIssue({
          path: ["password"],
          code: z.ZodIssueCode.custom,
          message: "Password is required when not sending an invite",
        });
      }
      if (!data.confirmPassword || data.confirmPassword.trim() === "") {
        ctx.addIssue({
          path: ["confirmPassword"],
          code: z.ZodIssueCode.custom,
          message: "Please confirm the password",
        });
      }
    }

    if (
      data.password &&
      data.password.trim() !== "" &&
      data.password !== data.confirmPassword
    ) {
      ctx.addIssue({
        path: ["confirmPassword"],
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
      });
    }
  });

/**
 * Schema for updating an existing user
 * Password and confirmPassword are optional
 */
export const updateUserSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must not exceed 50 characters")
      .regex(
        /^[a-zA-Z0-9._-]+$/,
        "Username can only contain letters, numbers, dots, underscores, and hyphens"
      ),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .regex(phoneRegex, "Invalid Australian phone number format"),
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name must not exceed 50 characters"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(50, "Last name must not exceed 50 characters"),
    password: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === "") return true;
          return passwordSchema.safeParse(val).success;
        },
        {
          message:
            "Password must be at least 8 characters with uppercase, lowercase, and number",
        }
      ),
    confirmPassword: z.string().optional(),
    roleId: z.string().uuid("Invalid role"),
    active: z.boolean(),
  })
  .refine(
    (data) => {
      // Only validate confirmPassword if password is provided
      if (data.password && data.password.trim() !== "") {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

/**
 * Schema for list users query parameters
 */
export const listUsersSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, "Page must be a positive number"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine(
      (val) => val > 0 && val <= 100,
      "Limit must be between 1 and 100"
    ),
});

/**
 * Schema for updating user profile (self-service)
 * Only includes editable fields: firstName, lastName, email, phone
 */
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must not exceed 50 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must not exceed 50 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(phoneRegex, "Invalid Australian phone number format"),
  roleId: z.string().uuid("Invalid role").optional(), // only respected for admin
});

// Export types for TypeScript
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
