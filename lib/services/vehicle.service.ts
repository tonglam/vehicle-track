import { db } from "@/drizzle/db";
import {
  vehicleAttachments,
  vehicleGroupAssignments,
  vehicleGroups,
  vehicles,
} from "@/drizzle/schema";
import type { NewVehicle, VehicleOption, VehicleWithGroup } from "@/types";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { auditLog } from "./audit.service";

export interface VehicleAttachment {
  url: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

export interface VehicleFilters {
  search?: string;
  status?: string;
  ownership?: string;
  limit?: number;
  offset?: number;
}

export interface VehicleListResult {
  vehicles: VehicleWithGroup[];
  total: number;
}

export async function listVehicleOptions(limit = 50): Promise<VehicleOption[]> {
  const rows = await db
    .select({
      id: vehicles.id,
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
      licensePlate: vehicles.licensePlate,
      status: vehicles.status,
      ownership: vehicles.ownership,
    })
    .from(vehicles)
    .orderBy(desc(vehicles.updatedAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    year: row.year,
    make: row.make,
    model: row.model,
    licensePlate: row.licensePlate,
    status: row.status,
    ownership: row.ownership,
  }));
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
    conditions.push(eq(vehicles.status, status as VehicleWithGroup["status"]));
  }

  if (ownership && ownership !== "all") {
    conditions.push(
      eq(vehicles.ownership, ownership as VehicleWithGroup["ownership"])
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [vehiclesList, countResult] = await Promise.all([
    db
      .select({
        id: vehicles.id,
        year: vehicles.year,
        make: vehicles.make,
        model: vehicles.model,
        licensePlate: vehicles.licensePlate,
        vin: vehicles.vin,
        status: vehicles.status,
        ownership: vehicles.ownership,
        ownerCompany: vehicles.ownerCompany,
        fuelType: vehicles.fuelType,
        transmission: vehicles.transmission,
        engineSizeL: vehicles.engineSizeL,
        odometer: vehicles.odometer,
        purchaseDate: vehicles.purchaseDate,
        lastServiceDate: vehicles.lastServiceDate,
        nextServiceDue: vehicles.nextServiceDue,
        notes: vehicles.notes,
        createdAt: vehicles.createdAt,
        updatedAt: vehicles.updatedAt,
        updatedBy: vehicles.updatedBy,
        groupName: vehicleGroups.name,
      })
      .from(vehicles)
      .leftJoin(
        vehicleGroupAssignments,
        eq(vehicles.id, vehicleGroupAssignments.vehicleId)
      )
      .leftJoin(
        vehicleGroups,
        eq(vehicleGroupAssignments.groupId, vehicleGroups.id)
      )
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

// Optimized version for dashboard - skips expensive joins
export async function listRecentVehicles(
  limit = 5
): Promise<VehicleWithGroup[]> {
  return await db
    .select({
      id: vehicles.id,
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
      licensePlate: vehicles.licensePlate,
      vin: vehicles.vin,
      status: vehicles.status,
      ownership: vehicles.ownership,
      ownerCompany: vehicles.ownerCompany,
      fuelType: vehicles.fuelType,
      transmission: vehicles.transmission,
      engineSizeL: vehicles.engineSizeL,
      odometer: vehicles.odometer,
      purchaseDate: vehicles.purchaseDate,
      lastServiceDate: vehicles.lastServiceDate,
      nextServiceDue: vehicles.nextServiceDue,
      notes: vehicles.notes,
      createdAt: vehicles.createdAt,
      updatedAt: vehicles.updatedAt,
      updatedBy: vehicles.updatedBy,
      groupName: sql<string>`'Default'`, // Simplified - no join needed for dashboard
    })
    .from(vehicles)
    .orderBy(desc(vehicles.updatedAt))
    .limit(limit);
}

export async function getVehicleById(
  id: string
): Promise<VehicleWithGroup | null> {
  const [vehicle] = await db
    .select({
      id: vehicles.id,
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
      licensePlate: vehicles.licensePlate,
      vin: vehicles.vin,
      status: vehicles.status,
      ownership: vehicles.ownership,
      ownerCompany: vehicles.ownerCompany,
      fuelType: vehicles.fuelType,
      transmission: vehicles.transmission,
      engineSizeL: vehicles.engineSizeL,
      odometer: vehicles.odometer,
      purchaseDate: vehicles.purchaseDate,
      lastServiceDate: vehicles.lastServiceDate,
      nextServiceDue: vehicles.nextServiceDue,
      notes: vehicles.notes,
      createdAt: vehicles.createdAt,
      updatedAt: vehicles.updatedAt,
      updatedBy: vehicles.updatedBy,
      groupName: vehicleGroups.name,
    })
    .from(vehicles)
    .leftJoin(
      vehicleGroupAssignments,
      eq(vehicles.id, vehicleGroupAssignments.vehicleId)
    )
    .leftJoin(
      vehicleGroups,
      eq(vehicleGroupAssignments.groupId, vehicleGroups.id)
    )
    .where(eq(vehicles.id, id))
    .limit(1);

  return vehicle || null;
}

export async function getOrCreateDefaultGroup(userId: string): Promise<string> {
  // Try to find existing default group
  const [existingGroup] = await db
    .select()
    .from(vehicleGroups)
    .where(eq(vehicleGroups.name, "Default Group"))
    .limit(1);

  if (existingGroup) {
    return existingGroup.id;
  }

  // Create default group if it doesn't exist
  const [newGroup] = await db
    .insert(vehicleGroups)
    .values({
      name: "Default Group",
      description: "Default group for unassigned vehicles",
      type: "general",
      createdBy: userId,
    })
    .returning();

  if (!newGroup) {
    throw new Error("Failed to create default vehicle group");
  }

  return newGroup.id;
}

export async function createVehicleAttachment(
  vehicleId: string,
  attachment: VehicleAttachment,
  userId: string
): Promise<void> {
  await db.insert(vehicleAttachments).values({
    vehicleId,
    fileUrl: attachment.url,
    fileName: attachment.fileName,
    fileSizeBytes: attachment.fileSize,
    contentType: attachment.contentType,
    createdBy: userId,
  });
}

export async function createVehicle(
  data: Omit<NewVehicle, "id" | "createdAt" | "updatedAt">,
  userId: string,
  attachments?: VehicleAttachment[]
): Promise<VehicleWithGroup> {
  // Create the vehicle (without groupId)
  const [vehicle] = await db
    .insert(vehicles)
    .values({
      year: data.year,
      make: data.make,
      model: data.model,
      licensePlate: data.licensePlate,
      vin: data.vin,
      status: data.status,
      ownership: data.ownership,
      ownerCompany: data.ownerCompany,
      fuelType: data.fuelType,
      transmission: data.transmission,
      engineSizeL: data.engineSizeL,
      odometer: data.odometer,
      purchaseDate: data.purchaseDate,
      lastServiceDate: data.lastServiceDate,
      nextServiceDue: data.nextServiceDue,
      notes: data.notes,
      updatedBy: userId,
    })
    .returning();

  if (!vehicle) {
    throw new Error("Failed to create vehicle");
  }

  // Get or create default group and assign vehicle to it
  const groupId = await getOrCreateDefaultGroup(userId);
  await db.insert(vehicleGroupAssignments).values({
    vehicleId: vehicle.id,
    groupId,
    assignedBy: userId,
  });

  // Create attachments if provided
  if (attachments && attachments.length > 0) {
    await Promise.all(
      attachments.map((attachment) =>
        createVehicleAttachment(vehicle.id, attachment, userId)
      )
    );
  }

  await auditLog({
    actorId: userId,
    entityType: "vehicle",
    entityId: vehicle.id,
    action: "create",
    metadata: { vehicle: data, attachmentCount: attachments?.length || 0 },
  });

  // Fetch the group name for the response
  const [group] = await db
    .select({ name: vehicleGroups.name })
    .from(vehicleGroups)
    .where(eq(vehicleGroups.id, groupId))
    .limit(1);

  return {
    ...vehicle,
    groupName: group?.name || null,
  };
}

export async function updateVehicle(
  id: string,
  data: Partial<Omit<NewVehicle, "id" | "createdAt" | "updatedAt" | "groupId">>,
  userId: string
): Promise<VehicleWithGroup> {
  // Update vehicle data (no groupId updates - that's handled separately)
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

  // Fetch the current group assignment for the response
  const result = await getVehicleById(id);
  if (!result) {
    throw new Error("Vehicle not found after update");
  }

  return result;
}

export async function deleteVehicle(id: string, userId: string): Promise<void> {
  // Audit log before deletion
  await auditLog({
    actorId: userId,
    entityType: "vehicle",
    entityId: id,
    action: "delete",
    metadata: {},
  });

  // Hard delete from database
  await db.delete(vehicles).where(eq(vehicles.id, id));
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
