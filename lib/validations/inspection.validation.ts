import { z } from "zod";

export const inspectionImagePayloadSchema = z.object({
  section: z.enum(["exterior", "interior", "mechanical"]),
  fileUrl: z.string().url(),
  fileName: z.string().min(1),
  fileSizeBytes: z.number().int().nonnegative(),
  contentType: z.string().min(1),
});

export const baseInspectionFieldsSchema = z.object({
  vehicleId: z.string().uuid(),
  exteriorCondition: z.string().min(1),
  interiorCondition: z.string().min(1),
  mechanicalCondition: z.string().min(1),
  additionalNotes: z.string().optional().nullable(),
  images: z.array(inspectionImagePayloadSchema).optional(),
});

export const createInspectionPayloadSchema = baseInspectionFieldsSchema.extend({
  status: z.enum(["draft", "submitted"]).default("draft"),
});

export const updateInspectionPayloadSchema = baseInspectionFieldsSchema;
