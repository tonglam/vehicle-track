import { db } from "@/drizzle/db";
import {
  groupManagerAssignments,
  roles,
  users,
  vehicleGroupAssignments,
  vehicleGroups,
  vehicles,
} from "@/drizzle/schema";
import type {
  CreateVehicleGroupInput,
  UpdateVehicleGroupInput,
  VehicleGroup,
  VehicleGroupDetail,
  VehicleGroupWithStats,
} from "@/types";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { auditLog } from "./audit.service";

export interface VehicleGroupFilters {
  limit?: number;
  offset?: number;
}

export interface VehicleGroupListResult {
  groups: VehicleGroupWithStats[];
  total: number;
}

export async function listVehicleGroups(
  filters: VehicleGroupFilters = {}
): Promise<VehicleGroupListResult> {
  const { limit = 100, offset = 0 } = filters;

  // Get all groups with stats
  const groupsWithStats = await db
    .select({
      id: vehicleGroups.id,
      name: vehicleGroups.name,
      description: vehicleGroups.description,
      type: vehicleGroups.type,
      signatureMode: vehicleGroups.signatureMode,
      contractId: vehicleGroups.contractId,
      areaManagerContact: vehicleGroups.areaManagerContact,
      createdAt: vehicleGroups.createdAt,
      updatedAt: vehicleGroups.updatedAt,
      createdBy: vehicleGroups.createdBy,
      totalVehicles: sql<number>`COUNT(DISTINCT ${vehicleGroupAssignments.vehicleId})::int`,
      activeVehicles: sql<number>`COUNT(DISTINCT CASE WHEN ${vehicles.status} IN ('available', 'assigned', 'temporarily_assigned') THEN ${vehicleGroupAssignments.vehicleId} END)::int`,
      assignedManagers: sql<number>`COUNT(DISTINCT ${groupManagerAssignments.managerId})::int`,
    })
    .from(vehicleGroups)
    .leftJoin(
      vehicleGroupAssignments,
      eq(vehicleGroups.id, vehicleGroupAssignments.groupId)
    )
    .leftJoin(vehicles, eq(vehicleGroupAssignments.vehicleId, vehicles.id))
    .leftJoin(
      groupManagerAssignments,
      eq(vehicleGroups.id, groupManagerAssignments.groupId)
    )
    .groupBy(vehicleGroups.id)
    .orderBy(desc(vehicleGroups.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(vehicleGroups);

  const total = countResult?.count || 0;

  return {
    groups: groupsWithStats,
    total,
  };
}

export async function getVehicleGroupById(
  id: string
): Promise<VehicleGroupDetail | null> {
  // Get basic group info
  const [group] = await db
    .select({
      id: vehicleGroups.id,
      name: vehicleGroups.name,
      description: vehicleGroups.description,
      type: vehicleGroups.type,
      signatureMode: vehicleGroups.signatureMode,
      contractId: vehicleGroups.contractId,
      areaManagerContact: vehicleGroups.areaManagerContact,
      createdAt: vehicleGroups.createdAt,
      updatedAt: vehicleGroups.updatedAt,
      createdBy: vehicleGroups.createdBy,
      createdByName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
    })
    .from(vehicleGroups)
    .leftJoin(users, eq(vehicleGroups.createdBy, users.id))
    .where(eq(vehicleGroups.id, id))
    .limit(1);

  if (!group) {
    return null;
  }

  // Get vehicles in this group
  const groupVehicles = await db
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
    .innerJoin(
      vehicleGroupAssignments,
      eq(vehicles.id, vehicleGroupAssignments.vehicleId)
    )
    .innerJoin(
      vehicleGroups,
      eq(vehicleGroupAssignments.groupId, vehicleGroups.id)
    )
    .where(eq(vehicleGroups.id, id))
    .orderBy(desc(vehicles.updatedAt));

  // Get assigned managers with their details
  const assignedManagers = await db
    .select({
      id: users.id,
      name: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      email: users.email,
      role: roles.name,
    })
    .from(groupManagerAssignments)
    .innerJoin(users, eq(groupManagerAssignments.managerId, users.id))
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(groupManagerAssignments.groupId, id))
    .orderBy(users.firstName);

  const assignedManagerIds = assignedManagers.map((m) => m.id);

  // Calculate stats
  const totalVehicles = groupVehicles.length;
  const activeVehicles = groupVehicles.filter((v) =>
    ["available", "assigned", "temporarily_assigned"].includes(v.status)
  ).length;

  return {
    ...group,
    totalVehicles,
    activeVehicles,
    assignedManagerIds,
    assignedManagers,
    vehicles: groupVehicles,
    createdByName: group.createdByName || "Unknown",
  };
}

export async function createVehicleGroup(
  data: CreateVehicleGroupInput,
  userId: string
): Promise<VehicleGroup> {
  const [group] = await db
    .insert(vehicleGroups)
    .values({
      name: data.name,
      description: data.description,
      contractId: data.contractId,
      areaManagerContact: data.areaManagerContact,
      signatureMode: data.signatureMode || "dual",
      createdBy: userId,
    })
    .returning();

  if (!group) {
    throw new Error("Failed to create vehicle group");
  }

  await auditLog({
    actorId: userId,
    entityType: "vehicle_group",
    entityId: group.id,
    action: "create",
    metadata: { group: data },
  });

  return group;
}

export async function updateVehicleGroup(
  id: string,
  data: UpdateVehicleGroupInput,
  userId: string
): Promise<VehicleGroup> {
  const [group] = await db
    .update(vehicleGroups)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(vehicleGroups.id, id))
    .returning();

  if (!group) {
    throw new Error("Vehicle group not found");
  }

  await auditLog({
    actorId: userId,
    entityType: "vehicle_group",
    entityId: id,
    action: "update",
    metadata: { changes: data },
  });

  return group;
}

export async function deleteVehicleGroup(
  id: string,
  userId: string
): Promise<void> {
  // Check if this is the Default Group
  const [group] = await db
    .select({ name: vehicleGroups.name })
    .from(vehicleGroups)
    .where(eq(vehicleGroups.id, id))
    .limit(1);

  if (group && group.name === "Default Group") {
    throw new Error("The Default Group cannot be deleted.");
  }

  // Check if group has vehicles
  const [vehicleCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(vehicleGroupAssignments)
    .where(eq(vehicleGroupAssignments.groupId, id));

  if (vehicleCount && vehicleCount.count > 0) {
    throw new Error(
      "Cannot delete group with assigned vehicles. Please reassign vehicles first."
    );
  }

  await auditLog({
    actorId: userId,
    entityType: "vehicle_group",
    entityId: id,
    action: "delete",
    metadata: {},
  });

  await db.delete(vehicleGroups).where(eq(vehicleGroups.id, id));
}

export async function assignManagerToGroup(
  groupId: string,
  managerId: string,
  userId: string
): Promise<void> {
  // Check if assignment already exists
  const [existing] = await db
    .select()
    .from(groupManagerAssignments)
    .where(
      and(
        eq(groupManagerAssignments.groupId, groupId),
        eq(groupManagerAssignments.managerId, managerId)
      )
    )
    .limit(1);

  if (existing) {
    throw new Error("Manager is already assigned to this group");
  }

  await db.insert(groupManagerAssignments).values({
    groupId,
    managerId,
  });

  await auditLog({
    actorId: userId,
    entityType: "vehicle_group",
    entityId: groupId,
    action: "assign_manager",
    metadata: { managerId },
  });
}

export async function removeManagerFromGroup(
  groupId: string,
  managerId: string,
  userId: string
): Promise<void> {
  await db
    .delete(groupManagerAssignments)
    .where(
      and(
        eq(groupManagerAssignments.groupId, groupId),
        eq(groupManagerAssignments.managerId, managerId)
      )
    );

  await auditLog({
    actorId: userId,
    entityType: "vehicle_group",
    entityId: groupId,
    action: "remove_manager",
    metadata: { managerId },
  });
}

export async function assignVehicleToGroup(
  vehicleId: string,
  groupId: string,
  userId: string
): Promise<void> {
  // Remove any existing assignments for this vehicle
  await db
    .delete(vehicleGroupAssignments)
    .where(eq(vehicleGroupAssignments.vehicleId, vehicleId));

  // Create new assignment
  await db.insert(vehicleGroupAssignments).values({
    vehicleId,
    groupId,
    assignedBy: userId,
  });

  await auditLog({
    actorId: userId,
    entityType: "vehicle",
    entityId: vehicleId,
    action: "assign_to_group",
    metadata: { groupId },
  });
}

export async function getAvailableManagers(): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    assignedGroups: Array<{ id: string; name: string }>;
  }>
> {
  // Get all active users with admin, manager, or inspector roles
  const usersWithRoles = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      roleName: roles.name,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.active, true))
    .orderBy(users.firstName);

  // Filter to only manager and inspector (admins don't need group assignment)
  const filteredUsers = usersWithRoles.filter((u) =>
    ["manager", "inspector"].includes(u.roleName)
  );

  // Get group assignments for these users
  const userIds = filteredUsers.map((u) => u.id);

  if (userIds.length === 0) {
    return [];
  }

  const groupAssignments = await db
    .select({
      managerId: groupManagerAssignments.managerId,
      groupId: vehicleGroups.id,
      groupName: vehicleGroups.name,
    })
    .from(groupManagerAssignments)
    .innerJoin(
      vehicleGroups,
      eq(groupManagerAssignments.groupId, vehicleGroups.id)
    )
    .where(inArray(groupManagerAssignments.managerId, userIds));

  // Build the result with assigned groups
  return filteredUsers.map((user) => {
    const userGroups = groupAssignments
      .filter((ga) => ga.managerId === user.id)
      .map((ga) => ({
        id: ga.groupId,
        name: ga.groupName,
      }));

    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.roleName,
      assignedGroups: userGroups,
    };
  });
}
