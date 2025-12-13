import { db } from "@/drizzle/db";
import {
  agreementTemplates,
  agreements,
  drivers,
  inspections,
  vehicles,
} from "@/drizzle/schema";
import type {
  Agreement,
  AgreementListItem,
  AgreementTemplateSummary,
} from "@/types";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { auditLog } from "./audit.service";

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
