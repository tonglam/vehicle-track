import { z } from "zod";

const phoneRegex = /^(\+61|0)[2-478](\s?\d{4}\s?\d{4}|(?:\d{8}))$/;

const optionalEmail = z
  .string()
  .email("Invalid email address")
  .optional()
  .or(z.literal(""))
  .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined));

const optionalPhone = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine(
    (val) =>
      !val || val.trim().length === 0 || phoneRegex.test(val.trim()),
    {
      message: "Invalid Australian phone number format",
    }
  )
  .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined));

const notesField = z
  .string()
  .max(2000, "Notes must be 2000 characters or less")
  .optional()
  .or(z.literal(""))
  .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined));

export const createDriverSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters"),
  email: optionalEmail,
  phone: optionalPhone,
  notes: notesField,
});

export const updateDriverSchema = createDriverSchema;

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
