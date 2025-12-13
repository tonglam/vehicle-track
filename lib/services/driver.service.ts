import { db } from "@/drizzle/db";
import {
  agreementTemplates,
  agreements,
  drivers,
  vehicles,
} from "@/drizzle/schema";
import type {
  Driver,
  DriverAgreementSummary,
  DriverDetail,
  DriverListItem,
} from "@/types";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { auditLog } from "./audit.service";

export interface DriverListFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

const ACTIVE_AGREEMENT_STATUSES = ["pending_signature", "signed"] as const;

type ActiveStatus = (typeof ACTIVE_AGREEMENT_STATUSES)[number];

function isActiveStatus(status: string): status is ActiveStatus {
  return (ACTIVE_AGREEMENT_STATUSES as readonly string[]).includes(status);
}

function normalizeSearchTerm(term?: string) {
  if (!term) return undefined;
  const trimmed = term.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export async function listDrivers(filters: DriverListFilters = {}) {
  const { limit = 20, offset = 0 } = filters;
  const searchTerm = normalizeSearchTerm(filters.search);

  const conditions = [];
  if (searchTerm) {
    const like = `%${searchTerm}%`;
    conditions.push(
      or(
        ilike(drivers.firstName, like),
        ilike(drivers.lastName, like),
        ilike(drivers.email, like),
        ilike(drivers.phone, like)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const driverRows = await db
    .select({
      id: drivers.id,
      firstName: drivers.firstName,
      lastName: drivers.lastName,
      email: drivers.email,
      phone: drivers.phone,
      createdAt: drivers.createdAt,
    })
    .from(drivers)
    .where(whereClause)
    .orderBy(desc(drivers.createdAt))
    .limit(limit)
    .offset(offset);

  const totalResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(drivers)
    .where(whereClause);

  const total = totalResult[0]?.count ?? 0;

  return {
    drivers: driverRows as DriverListItem[],
    total,
  };
}

export async function getDriverDetail(
  id: string
): Promise<DriverDetail | null> {
  const [driverRecord] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.id, id))
    .limit(1);

  if (!driverRecord) {
    return null;
  }

  const agreementsForDriver = await db
    .select({
      id: agreements.id,
      status: agreements.status,
      signedAt: agreements.signedAt,
      createdAt: agreements.createdAt,
      templateTitle: agreementTemplates.title,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      vehicleYear: vehicles.year,
      licensePlate: vehicles.licensePlate,
    })
    .from(agreements)
    .leftJoin(
      agreementTemplates,
      eq(agreements.templateId, agreementTemplates.id)
    )
    .leftJoin(vehicles, eq(agreements.vehicleId, vehicles.id))
    .where(eq(agreements.signedByDriverId, id))
    .orderBy(desc(agreements.createdAt));

  const agreementSummaries: DriverAgreementSummary[] = agreementsForDriver.map(
    (agreement) => ({
      id: agreement.id,
      status: agreement.status,
      signedAt: agreement.signedAt,
      createdAt: agreement.createdAt,
      templateTitle: agreement.templateTitle || "Unnamed Template",
      vehicleName: agreement.vehicleMake
        ? `${agreement.vehicleYear ?? ""} ${agreement.vehicleMake} ${agreement.vehicleModel ?? ""}`.trim()
        : "Unknown Vehicle",
      licensePlate: agreement.licensePlate || "—",
    })
  );

  const totalAgreements = agreementSummaries.length;
  const activeAgreements = agreementSummaries.filter((agreement) =>
    isActiveStatus(agreement.status)
  ).length;

  return {
    ...driverRecord,
    stats: {
      totalAgreements,
      activeAgreements,
    },
    agreements: agreementSummaries,
  };
}

export async function createDriver(
  data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    notes?: string;
  },
  userId: string
): Promise<Driver> {
  const [driver] = await db
    .insert(drivers)
    .values({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email ?? null,
      phone: data.phone ?? null,
      notes: data.notes ?? null,
      createdBy: userId,
    })
    .returning();

  if (!driver) {
    throw new Error("Failed to create driver");
  }

  await auditLog({
    actorId: userId,
    entityType: "driver",
    entityId: driver.id,
    action: "create",
    metadata: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
    },
  });

  return driver;
}

export async function updateDriver(
  id: string,
  data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    notes?: string;
  },
  userId: string
): Promise<Driver> {
  const [driver] = await db
    .update(drivers)
    .set({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email ?? null,
      phone: data.phone ?? null,
      notes: data.notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(drivers.id, id))
    .returning();

  if (!driver) {
    throw new Error("Driver not found");
  }

  await auditLog({
    actorId: userId,
    entityType: "driver",
    entityId: id,
    action: "update",
    metadata: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
    },
  });

  return driver;
}

export async function deleteDriver(id: string, userId: string): Promise<void> {
  const [driver] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.id, id))
    .limit(1);

  if (!driver) {
    throw new Error("Driver not found");
  }

  await db.delete(drivers).where(eq(drivers.id, id));

  await auditLog({
    actorId: userId,
    entityType: "driver",
    entityId: id,
    action: "delete",
    metadata: {
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phone: driver.phone,
    },
  });
}
