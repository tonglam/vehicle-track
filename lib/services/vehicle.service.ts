import { db } from "@/drizzle/db";
import { vehicles } from "@/drizzle/schema";
import type { NewVehicle, Vehicle } from "@/types";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { auditLog } from "./audit.service";

export interface VehicleFilters {
  search?: string;
  status?: string;
  ownership?: string;
  limit?: number;
  offset?: number;
}

export interface VehicleListResult {
  vehicles: Vehicle[];
  total: number;
}

export async function listVehicles(
  filters: VehicleFilters
): Promise<VehicleListResult> {
  const { search, status, ownership, limit = 10, offset = 0 } = filters;

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(vehicles.licensePlate, `%${search}%`),
        like(vehicles.make, `%${search}%`),
        like(vehicles.model, `%${search}%`)
      )
    );
  }

  if (status && status !== "all") {
    conditions.push(eq(vehicles.status, status as Vehicle["status"]));
  }

  if (ownership && ownership !== "all") {
    conditions.push(eq(vehicles.ownership, ownership as Vehicle["ownership"]));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [vehiclesList, countResult] = await Promise.all([
    db
      .select()
      .from(vehicles)
      .where(whereClause)
      .orderBy(desc(vehicles.updatedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(vehicles)
      .where(whereClause),
  ]);

  const total = countResult[0]?.count || 0;

  return {
    vehicles: vehiclesList,
    total,
  };
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, id))
    .limit(1);

  return vehicle || null;
}

export async function createVehicle(
  data: Omit<NewVehicle, "id" | "createdAt" | "updatedAt">,
  userId: string
): Promise<Vehicle> {
  const [vehicle] = await db
    .insert(vehicles)
    .values({
      ...data,
      updatedBy: userId,
    })
    .returning();

  if (!vehicle) {
    throw new Error("Failed to create vehicle");
  }

  await auditLog({
    actorId: userId,
    entityType: "vehicle",
    entityId: vehicle.id,
    action: "create",
    metadata: { vehicle: data },
  });

  return vehicle;
}

export async function updateVehicle(
  id: string,
  data: Partial<Omit<NewVehicle, "id" | "createdAt" | "updatedAt">>,
  userId: string
): Promise<Vehicle> {
  const [vehicle] = await db
    .update(vehicles)
    .set({
      ...data,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(vehicles.id, id))
    .returning();

  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  await auditLog({
    actorId: userId,
    entityType: "vehicle",
    entityId: id,
    action: "update",
    metadata: { changes: data },
  });

  return vehicle;
}

export async function softDeleteVehicle(
  id: string,
  userId: string
): Promise<void> {
  await updateVehicle(id, { status: "retired" }, userId);

  await auditLog({
    actorId: userId,
    entityType: "vehicle",
    entityId: id,
    action: "soft_delete",
    metadata: {},
  });
}
