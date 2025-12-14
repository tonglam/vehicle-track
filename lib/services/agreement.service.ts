import { db } from "@/drizzle/db";
import {
  agreementTemplates,
  agreements,
  drivers,
  inspectionImages,
  inspections,
  vehicles,
  organizations,
} from "@/drizzle/schema";
import type {
  Agreement,
  AgreementDetailContext,
  AgreementFinaliseContext,
  AgreementListItem,
  AgreementTemplateSummary,
} from "@/types";
import { and, asc, desc, eq, ilike, or, sql, not, type SQL } from "drizzle-orm";
import { auditLog } from "./audit.service";
import { listAgreementSupportingDocs } from "@/lib/storage";
import { users as inspectorUsers } from "@/drizzle/schema";

export interface AgreementListFilters {
  status?: Agreement["status"];
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AgreementListResult {
  agreements: AgreementListItem[];
  total: number;
}

export interface CreateAgreementInput {
  vehicleId: string;
  inspectionId: string;
  templateId: string;
  userId: string;
}

export interface CreateAgreementTemplateInput {
  title: string;
  contentRichtext: string;
  active: boolean;
  userId: string;
}

function buildVehicleDisplayName(options: {
  year: number | null;
  make: string | null;
  model: string | null;
}) {
  const parts = [] as string[];
  if (options.year) parts.push(String(options.year));
  if (options.make) parts.push(options.make);
  if (options.model) parts.push(options.model);
  return parts.length > 0 ? parts.join(" ") : "Unknown Vehicle";
}

function normalizeSearchTerm(term?: string) {
  if (!term) return undefined;
  const trimmed = term.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export async function listAgreements(
  filters: AgreementListFilters = {}
): Promise<AgreementListResult> {
  const { limit = 10, offset = 0 } = filters;
  const searchTerm = normalizeSearchTerm(filters.search);

  const conditions: SQL<unknown>[] = [];

  if (filters.status) {
    conditions.push(eq(agreements.status, filters.status));
  }

  if (searchTerm) {
    const likeTerm = `%${searchTerm}%`;
    const searchCondition = or(
      ilike(vehicles.licensePlate, likeTerm),
      ilike(vehicles.make, likeTerm),
      ilike(vehicles.model, likeTerm),
      ilike(agreementTemplates.title, likeTerm)
    );

    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  let whereClause: SQL<unknown> | undefined;

  if (conditions.length === 1) {
    whereClause = conditions[0];
  } else if (conditions.length > 1) {
    whereClause = and(...conditions);
  }

  const baseListQuery = db
    .select({
      id: agreements.id,
      status: agreements.status,
      createdAt: agreements.createdAt,
      updatedAt: agreements.updatedAt,
      signedAt: agreements.signedAt,
      templateTitle: agreementTemplates.title,
      templateContent: agreementTemplates.contentRichtext,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      vehicleYear: vehicles.year,
      licensePlate: vehicles.licensePlate,
      driverFirstName: drivers.firstName,
      driverLastName: drivers.lastName,
    })
    .from(agreements)
    .leftJoin(vehicles, eq(agreements.vehicleId, vehicles.id))
    .leftJoin(
      agreementTemplates,
      eq(agreements.templateId, agreementTemplates.id)
    )
    .leftJoin(drivers, eq(agreements.signedByDriverId, drivers.id));

  const listQuery = (() => {
    if (!whereClause) {
      return baseListQuery;
    }
    return baseListQuery.where(whereClause);
  })();

  const baseCountQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(agreements)
    .leftJoin(vehicles, eq(agreements.vehicleId, vehicles.id))
    .leftJoin(
      agreementTemplates,
      eq(agreements.templateId, agreementTemplates.id)
    );

  const countQuery = (() => {
    if (!whereClause) {
      return baseCountQuery;
    }
    return baseCountQuery.where(whereClause);
  })();

  const [rows, totalResult] = await Promise.all([
    listQuery.orderBy(desc(agreements.createdAt)).limit(limit).offset(offset),
    countQuery,
  ]);

  const agreementRows: AgreementListItem[] = rows.map((row) => ({
    id: row.id,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    signedAt: row.signedAt,
    templateTitle: row.templateTitle ?? "Untitled Template",
    vehicleDisplayName: buildVehicleDisplayName({
      year: row.vehicleYear,
      make: row.vehicleMake,
      model: row.vehicleModel,
    }),
    licensePlate: row.licensePlate ?? "—",
    signedBy:
      row.driverFirstName || row.driverLastName
        ? `${row.driverFirstName ?? ""} ${row.driverLastName ?? ""}`.trim()
        : null,
  }));

  const total = totalResult[0]?.count ?? 0;

  return { agreements: agreementRows, total };
}

export async function listAgreementTemplatesSummary(): Promise<
  AgreementTemplateSummary[]
> {
  const templates = await db
    .select({
      id: agreementTemplates.id,
      title: agreementTemplates.title,
      active: agreementTemplates.active,
      createdAt: agreementTemplates.createdAt,
      updatedAt: agreementTemplates.updatedAt,
    })
    .from(agreementTemplates)
    .orderBy(desc(agreementTemplates.updatedAt));
  return templates;
}

export async function getAgreementTemplateById(id: string) {
  const [template] = await db
    .select({
      id: agreementTemplates.id,
      title: agreementTemplates.title,
      contentRichtext: agreementTemplates.contentRichtext,
      active: agreementTemplates.active,
      createdAt: agreementTemplates.createdAt,
      updatedAt: agreementTemplates.updatedAt,
      createdBy: agreementTemplates.createdBy,
    })
    .from(agreementTemplates)
    .where(eq(agreementTemplates.id, id))
    .limit(1);

  return template || null;
}

export async function createAgreementRecord(
  input: CreateAgreementInput
): Promise<Agreement> {
  const { vehicleId, inspectionId, templateId, userId } = input;

  const [inspection] = await db
    .select({
      id: inspections.id,
      vehicleId: inspections.vehicleId,
    })
    .from(inspections)
    .where(eq(inspections.id, inspectionId))
    .limit(1);

  if (!inspection) {
    throw new Error("Inspection not found");
  }

  if (inspection.vehicleId !== vehicleId) {
    throw new Error("Inspection does not match selected vehicle");
  }

  const [agreement] = await db
    .insert(agreements)
    .values({
      vehicleId,
      inspectionId,
      templateId,
      createdBy: userId,
      status: "draft",
    })
    .returning();

  if (!agreement) {
    throw new Error("Failed to create agreement");
  }

  await auditLog({
    actorId: userId,
    entityType: "agreement",
    entityId: agreement.id,
    action: "create",
    metadata: {
      vehicleId,
      inspectionId,
      templateId,
    },
  });

  return agreement;
}

export async function createAgreementTemplate(
  input: CreateAgreementTemplateInput
) {
  const { title, contentRichtext, active, userId } = input;

  const [template] = await db
    .insert(agreementTemplates)
    .values({
      title,
      contentRichtext,
      active,
      createdBy: userId,
    })
    .returning();

  if (!template) {
    throw new Error("Failed to create agreement template");
  }

  await auditLog({
    actorId: userId,
    entityType: "agreement_template",
    entityId: template.id,
    action: "create",
    metadata: {
      title,
      active,
    },
  });

  return template;
}

export async function getAgreementFinaliseContext(
  agreementId: string
): Promise<AgreementFinaliseContext | null> {
  const [row] = await db
    .select({
      id: agreements.id,
      status: agreements.status,
      createdAt: agreements.createdAt,
      finalContentRichtext: agreements.finalContentRichtext,
      signingToken: agreements.signingToken,
      vehicleYear: vehicles.year,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      licensePlate: vehicles.licensePlate,
      templateId: agreementTemplates.id,
      templateTitle: agreementTemplates.title,
      templateContent: agreementTemplates.contentRichtext,
    })
    .from(agreements)
    .leftJoin(vehicles, eq(agreements.vehicleId, vehicles.id))
    .leftJoin(
      agreementTemplates,
      eq(agreements.templateId, agreementTemplates.id)
    )
    .where(eq(agreements.id, agreementId))
    .limit(1);

  if (!row || !row.templateId || !row.templateContent) {
    return null;
  }

  return {
    id: row.id,
    status: row.status,
    createdAt: row.createdAt,
    vehicle: {
      displayName: buildVehicleDisplayName({
        year: row.vehicleYear,
        make: row.vehicleMake,
        model: row.vehicleModel,
      }),
      licensePlate: row.licensePlate ?? "—",
    },
    finalContentRichtext: row.finalContentRichtext ?? row.templateContent ?? null,
    signingToken: row.signingToken ?? null,
    template: {
      id: row.templateId,
      title: row.templateTitle ?? "Untitled Template",
      contentRichtext: row.templateContent,
    },
  };
}

export async function getAgreementDetailContext(
  agreementId: string
): Promise<AgreementDetailContext | null> {
  const [row] = await db
    .select({
      id: agreements.id,
      status: agreements.status,
      createdAt: agreements.createdAt,
      finalContentRichtext: agreements.finalContentRichtext,
      signingToken: agreements.signingToken,
      templateTitle: agreementTemplates.title,
      vehicleId: agreements.vehicleId,
      vehicleYear: vehicles.year,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      licensePlate: vehicles.licensePlate,
      vehicleStatus: vehicles.status,
      ownership: vehicles.ownership,
      inspectionId: inspections.id,
      inspectionDate: inspections.updatedAt,
      inspectorFirstName: inspectorUsers.firstName,
      inspectorLastName: inspectorUsers.lastName,
      inspectionStatus: inspections.status,
      exteriorCondition: inspections.exteriorCondition,
      interiorCondition: inspections.interiorCondition,
      mechanicalCondition: inspections.mechanicalCondition,
      additionalNotes: inspections.additionalNotes,
      vehicleVin: vehicles.vin,
    })
    .from(agreements)
    .leftJoin(vehicles, eq(agreements.vehicleId, vehicles.id))
    .leftJoin(
      inspections,
      eq(agreements.inspectionId, inspections.id)
    )
    .leftJoin(
      inspectorUsers,
      eq(inspections.inspectorId, inspectorUsers.id)
    )
    .leftJoin(
      agreementTemplates,
      eq(agreements.templateId, agreementTemplates.id)
    )
    .where(eq(agreements.id, agreementId))
    .limit(1);

  if (!row) {
    return null;
  }

  if (!row.inspectionId) {
    return null;
  }

  const [docs, images, availableInspections] = await Promise.all([
    listAgreementSupportingDocs(agreementId),
    db
      .select({
        id: inspectionImages.id,
        section: inspectionImages.section,
        url: inspectionImages.fileUrl,
        name: inspectionImages.fileName,
        size: inspectionImages.fileSizeBytes,
      })
      .from(inspectionImages)
      .where(eq(inspectionImages.inspectionId, row.inspectionId))
      .orderBy(asc(inspectionImages.section), asc(inspectionImages.createdAt)),
    row.vehicleId
      ? db
          .select({
            id: inspections.id,
            date: inspections.updatedAt,
            status: inspections.status,
            inspectorFirstName: inspectorUsers.firstName,
            inspectorLastName: inspectorUsers.lastName,
          })
          .from(inspections)
          .leftJoin(
            inspectorUsers,
            eq(inspections.inspectorId, inspectorUsers.id)
          )
          .where(
            and(
              eq(inspections.vehicleId, row.vehicleId),
              not(eq(inspections.id, row.inspectionId))
            )
          )
          .orderBy(desc(inspections.updatedAt))
      : Promise.resolve([]),
  ]);

  return {
    id: row.id,
    status: row.status,
    createdAt: row.createdAt,
    templateTitle: row.templateTitle ?? "Untitled Template",
    vehicle: {
      displayName: buildVehicleDisplayName({
        year: row.vehicleYear,
        make: row.vehicleMake,
        model: row.vehicleModel,
      }),
      licensePlate: row.licensePlate ?? "—",
      status: row.vehicleStatus ?? null,
      ownership: row.ownership ?? null,
    },
    finalContentRichtext: row.finalContentRichtext ?? row.templateContent ?? null,
    signingToken: row.signingToken ?? null,
    inspection: {
      id: row.inspectionId!,
      date: row.inspectionDate ?? row.createdAt,
      inspector:
        row.inspectorFirstName || row.inspectorLastName
          ? `${row.inspectorFirstName ?? ""} ${row.inspectorLastName ?? ""}`.trim()
          : null,
      status: row.inspectionStatus ?? "draft",
      exteriorCondition: row.exteriorCondition,
      interiorCondition: row.interiorCondition,
      mechanicalCondition: row.mechanicalCondition,
      notes: row.additionalNotes,
      vehicleMake: row.vehicleMake,
      vehicleModel: row.vehicleModel,
      vehicleYear: row.vehicleYear,
      vehicleVin: row.vehicleVin,
      images: images.map((image) => ({
        id: image.id,
        section: image.section,
        url: image.url,
        name: image.name,
        size: image.size,
      })),
    },
    supportingDocuments: docs.map((doc) => ({
      id: doc.path,
      name: doc.name,
      size: doc.size,
      url: doc.url,
    })),
    availableInspections: (Array.isArray(availableInspections)
      ? availableInspections
      : []
    ).map((insp) => ({
      id: insp.id,
      date: insp.date ?? new Date(),
      status: insp.status,
      inspector:
        insp.inspectorFirstName || insp.inspectorLastName
          ? `${insp.inspectorFirstName ?? ""} ${insp.inspectorLastName ?? ""}`.trim()
          : null,
    })),
  };
}

export async function getAgreementSigningContext(
  signingToken: string
): Promise<AgreementSigningContext | null> {
  const [row] = await db
    .select({
      id: agreements.id,
      status: agreements.status,
      signingToken: agreements.signingToken,
      vehicleYear: vehicles.year,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      licensePlate: vehicles.licensePlate,
      finalContent: agreements.finalContentRichtext,
      templateContent: agreementTemplates.contentRichtext,
      driverFirstName: drivers.firstName,
      driverLastName: drivers.lastName,
      driverEmail: drivers.email,
      driverPhone: drivers.phone,
    })
    .from(agreements)
    .leftJoin(vehicles, eq(agreements.vehicleId, vehicles.id))
    .leftJoin(drivers, eq(agreements.signedByDriverId, drivers.id))
    .leftJoin(
      agreementTemplates,
      eq(agreements.templateId, agreementTemplates.id)
    )
    .where(eq(agreements.signingToken, signingToken))
    .limit(1);

  if (!row || !row.signingToken) {
    return null;
  }

  const detail = await getAgreementDetailContext(row.id);

  const agreementHtml =
    detail?.finalContentRichtext ??
    row.finalContent ??
    row.templateContent ??
    "";

  return {
    id: row.id,
    status: row.status,
    signingToken: row.signingToken,
    agreementHtml,
    vehicle: {
      displayName: buildVehicleDisplayName({
        year: row.vehicleYear,
        make: row.vehicleMake,
        model: row.vehicleModel,
      }),
      licensePlate: row.licensePlate ?? "—",
    },
    driver: {
      name:
        `${row.driverFirstName ?? ""} ${row.driverLastName ?? ""}`.trim() ||
        "Driver",
      email: row.driverEmail ?? null,
      phone: row.driverPhone ?? null,
    },
    inspection: detail?.inspection ?? null,
    supportingDocuments: detail?.supportingDocuments ?? [],
  };
}
