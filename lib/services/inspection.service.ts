import { db } from "@/drizzle/db";
import { inspectionImages, inspections, users, vehicles } from "@/drizzle/schema";
import type { InspectionListItem } from "@/types";
import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";

export interface InspectionListFilters {
  vehicleId?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

const VALID_INSPECTION_STATUSES = ["draft", "submitted"] as const;
type InspectionStatusFilter = (typeof VALID_INSPECTION_STATUSES)[number];
function normalizeStatus(value?: string): InspectionStatusFilter | undefined {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  return VALID_INSPECTION_STATUSES.includes(lower as InspectionStatusFilter)
    ? (lower as InspectionStatusFilter)
    : undefined;
}

export async function listInspections(
  filters: InspectionListFilters = {}
): Promise<{ inspections: InspectionListItem[]; total: number }> {
  const { vehicleId, search, limit = 10, offset = 0 } = filters;
  const normalizedStatus = normalizeStatus(filters.status);

  const baseQuery = db
    .select({
      id: inspections.id,
      vehicleId: inspections.vehicleId,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      vehicleYear: vehicles.year,
      vehicleLicense: vehicles.licensePlate,
      status: inspections.status,
      createdAt: inspections.createdAt,
      updatedAt: inspections.updatedAt,
      submittedAt: inspections.submittedAt,
      inspectorFirstName: users.firstName,
      inspectorLastName: users.lastName,
    })
    .from(inspections)
    .leftJoin(users, eq(inspections.inspectorId, users.id))
    .leftJoin(vehicles, eq(inspections.vehicleId, vehicles.id));

  const conditions = [];
  if (vehicleId) {
    conditions.push(eq(inspections.vehicleId, vehicleId));
  }
  if (normalizedStatus) {
    conditions.push(eq(inspections.status, normalizedStatus));
  }
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(ilike(vehicles.licensePlate, term));
  }

  const whereClause =
    conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : and(...conditions);

  const filteredQuery = whereClause ? baseQuery.where(whereClause) : baseQuery;

  const baseCountQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(inspections)
    .leftJoin(users, eq(inspections.inspectorId, users.id))
    .leftJoin(vehicles, eq(inspections.vehicleId, vehicles.id));
  const countQuery = whereClause ? baseCountQuery.where(whereClause) : baseCountQuery;

  const [rows, countResult] = await Promise.all([
    filteredQuery.orderBy(desc(inspections.updatedAt)).limit(limit).offset(offset),
    countQuery,
  ]);

  const inspectionsList = rows.map((row) => ({
    id: row.id,
    vehicleId: row.vehicleId,
    vehicleLicensePlate: row.vehicleLicense,
    vehicleDisplayName: row.vehicleMake
      ? `${row.vehicleYear ?? ""} ${row.vehicleMake} ${row.vehicleModel ?? ""}`.trim()
      : null,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    submittedAt: row.submittedAt,
    inspectorName:
      row.inspectorFirstName || row.inspectorLastName
        ? `${row.inspectorFirstName ?? ""} ${row.inspectorLastName ?? ""}`.trim()
        : null,
  }));

  const total = countResult[0]?.count ?? 0;

  return { inspections: inspectionsList, total };
}

interface CreateInspectionInput {
  vehicleId: string;
  status: "draft" | "submitted";
  exteriorCondition: string;
  interiorCondition: string;
  mechanicalCondition: string;
  additionalNotes?: string;
}

interface CreateInspectionImageInput {
  section: "exterior" | "interior" | "mechanical";
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  contentType: string;
}

interface UpdateInspectionInput {
  vehicleId: string;
  exteriorCondition: string;
  interiorCondition: string;
  mechanicalCondition: string;
  additionalNotes?: string;
  images?: CreateInspectionImageInput[];
}

export async function createInspection(
  data: CreateInspectionInput,
  userId: string,
  images: CreateInspectionImageInput[] = []
) {
  const submittedAt = data.status === "submitted" ? new Date() : null;

  return db.transaction(async (tx) => {
    const [inspection] = await tx
      .insert(inspections)
      .values({
        vehicleId: data.vehicleId,
        inspectorId: userId,
        status: data.status,
        exteriorCondition: data.exteriorCondition,
        interiorCondition: data.interiorCondition,
        mechanicalCondition: data.mechanicalCondition,
        additionalNotes: data.additionalNotes ?? null,
        submittedAt,
      })
      .returning();

    if (!inspection) {
      throw new Error("Failed to create inspection");
    }

    if (images.length > 0) {
      await tx.insert(inspectionImages).values(
        images.map((image) => ({
          inspectionId: inspection.id,
          section: image.section,
          fileUrl: image.fileUrl,
          fileName: image.fileName,
          fileSizeBytes: image.fileSizeBytes,
          contentType: image.contentType,
          createdBy: userId,
        }))
      );
    }

    return inspection;
  });
}

export async function getInspectionById(id: string) {
  const [inspection] = await db
    .select({
      id: inspections.id,
      vehicleId: inspections.vehicleId,
      status: inspections.status,
      createdAt: inspections.createdAt,
      updatedAt: inspections.updatedAt,
      submittedAt: inspections.submittedAt,
      exteriorCondition: inspections.exteriorCondition,
      interiorCondition: inspections.interiorCondition,
      mechanicalCondition: inspections.mechanicalCondition,
      additionalNotes: inspections.additionalNotes,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      vehicleYear: vehicles.year,
      vehicleLicense: vehicles.licensePlate,
      vehicleVin: vehicles.vin,
      inspectorFirstName: users.firstName,
      inspectorLastName: users.lastName,
    })
    .from(inspections)
    .leftJoin(users, eq(inspections.inspectorId, users.id))
    .leftJoin(vehicles, eq(inspections.vehicleId, vehicles.id))
    .where(eq(inspections.id, id))
    .limit(1);

  if (!inspection) {
    return null;
  }

  const images = await db
    .select({
      id: inspectionImages.id,
      section: inspectionImages.section,
      fileUrl: inspectionImages.fileUrl,
      fileName: inspectionImages.fileName,
      fileSizeBytes: inspectionImages.fileSizeBytes,
      contentType: inspectionImages.contentType,
      createdAt: inspectionImages.createdAt,
    })
    .from(inspectionImages)
    .where(eq(inspectionImages.inspectionId, id))
    .orderBy(asc(inspectionImages.section), asc(inspectionImages.createdAt));

  return {
    id: inspection.id,
    vehicleId: inspection.vehicleId,
    vehicleDisplayName: inspection.vehicleMake
      ? `${inspection.vehicleYear ?? ""} ${inspection.vehicleMake} ${inspection.vehicleModel ?? ""}`.trim()
      : "Unknown Vehicle",
    vehicleLicensePlate: inspection.vehicleLicense,
    vehicleMake: inspection.vehicleMake,
    vehicleModel: inspection.vehicleModel,
    vehicleYear: inspection.vehicleYear,
    vehicleVin: inspection.vehicleVin,
    status: inspection.status,
    createdAt: inspection.createdAt,
    updatedAt: inspection.updatedAt,
    submittedAt: inspection.submittedAt,
    exteriorCondition: inspection.exteriorCondition,
    interiorCondition: inspection.interiorCondition,
    mechanicalCondition: inspection.mechanicalCondition,
    additionalNotes: inspection.additionalNotes,
    inspectorName:
      inspection.inspectorFirstName || inspection.inspectorLastName
        ? `${inspection.inspectorFirstName ?? ""} ${inspection.inspectorLastName ?? ""}`.trim()
        : null,
    images,
  };
}

export async function updateInspection(
  id: string,
  data: UpdateInspectionInput,
  userId: string
) {
  return db.transaction(async (tx) => {
    const [inspection] = await tx
      .update(inspections)
      .set({
        vehicleId: data.vehicleId,
        exteriorCondition: data.exteriorCondition,
        interiorCondition: data.interiorCondition,
        mechanicalCondition: data.mechanicalCondition,
        additionalNotes: data.additionalNotes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(inspections.id, id))
      .returning();

    if (!inspection) {
      throw new Error("Inspection not found");
    }

    await tx.delete(inspectionImages).where(eq(inspectionImages.inspectionId, id));

    if (data.images && data.images.length > 0) {
      await tx.insert(inspectionImages).values(
        data.images.map((image) => ({
          inspectionId: inspection.id,
          section: image.section,
          fileUrl: image.fileUrl,
          fileName: image.fileName,
          fileSizeBytes: image.fileSizeBytes,
          contentType: image.contentType,
          createdBy: userId,
        }))
      );
    }

    return inspection;
  });
}

export async function updateInspectionStatus(
  id: string,
  status: "draft" | "submitted"
) {
  const submittedAt = status === "submitted" ? new Date() : null;

  const [inspection] = await db
    .update(inspections)
    .set({
      status,
      submittedAt,
      updatedAt: new Date(),
    })
    .where(eq(inspections.id, id))
    .returning({
      id: inspections.id,
      status: inspections.status,
      submittedAt: inspections.submittedAt,
      updatedAt: inspections.updatedAt,
    });

  if (!inspection) {
    throw new Error("Inspection not found");
  }

  return inspection;
}

export async function deleteInspection(id: string) {
  const [inspection] = await db
    .delete(inspections)
    .where(eq(inspections.id, id))
    .returning({ id: inspections.id });

  if (!inspection) {
    throw new Error("Inspection not found");
  }

  return inspection;
}
