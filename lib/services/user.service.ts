// @ts-nocheck
import { db } from "@/drizzle/db";
import { accounts, roles, users } from "@/drizzle/schema";
import bcrypt from "bcrypt";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { auditLog } from "./audit.service";

export interface ListUsersFilters {
  limit?: number;
  offset?: number;
  search?: string;
  role?: string;
  active?: string;
}

const ROLE_FILTER_VALUES = ["admin", "manager", "inspector", "viewer"] as const;
type RoleFilterValue = (typeof ROLE_FILTER_VALUES)[number];

function isRoleFilter(value: string): value is RoleFilterValue {
  return (ROLE_FILTER_VALUES as readonly string[]).includes(value);
}

export interface UserWithRole {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  roleId: string;
  roleName: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  username: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password?: string;
  roleId: string;
  active: boolean;
  sendInvite: boolean;
}

export interface UpdateUserData {
  username: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password?: string;
  roleId: string;
  active: boolean;
}

/**
 * List users with pagination and role information
 */
export async function listUsers(filters: ListUsersFilters = {}) {
  const { limit = 10, offset = 0, search, role, active } = filters;

  const clauses = [] as any[];

  if (search && search.trim().length > 0) {
    const query = `%${search.trim()}%`;
    clauses.push(
      or(
        ilike(users.username, query),
        ilike(users.email, query),
        ilike(users.firstName, query),
        ilike(users.lastName, query)
      )
    );
  }

  if (role && role !== "all" && isRoleFilter(role)) {
    clauses.push(eq(roles.name, role));
  }

  if (active && active !== "all") {
    clauses.push(eq(users.active, active === "active"));
  }

  const whereClause = clauses.length > 0 ? and(...clauses) : undefined;

  // Optimized: Get users with their role names
  // Use INNER JOIN since all users should have a valid role
  const usersList = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      roleId: users.roleId,
      roleName: roles.name,
      active: users.active,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id)) // Changed to INNER JOIN for better performance
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(users.createdAt)); // Changed to DESC for better index utilization

  // Optimized count query - avoid JOIN when not filtering by role
  let total: number;
  if (role && role !== "all" && isRoleFilter(role)) {
    // Only do JOIN when filtering by role
    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(whereClause);
    total = totalResult[0]?.count || 0;
  } else {
    // Simple count without JOIN for better performance
  const totalResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(whereClause);
    total = totalResult[0]?.count || 0;
  }

  return {
    users: usersList as UserWithRole[],
    total,
  };
}

/**
 * Get a single user by ID with role information
 */
export async function getUserById(id: string): Promise<UserWithRole | null> {
  const result = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      roleId: users.roleId,
      roleName: roles.name,
      active: users.active,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, id))
    .limit(1);

  return (result[0] as UserWithRole) || null;
}

/**
 * Create a new user with hashed password
 */
export async function createUser(
  data: CreateUserData,
  currentUserId: string
): Promise<UserWithRole> {
  // Only check for username uniqueness (not email)
  const [existingUsername] = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.username, data.username))
    .limit(1);

  if (existingUsername) {
    throw new Error("Username is already taken");
  }

  const shouldHashPassword = data.password && data.password.trim() !== "";
  const hashedPassword = shouldHashPassword
    ? await bcrypt.hash(data.password!, 6)
    : null;

  const [role] = await db
    .select({ name: roles.name })
    .from(roles)
    .where(eq(roles.id, data.roleId))
    .limit(1);

  if (!role) {
    throw new Error("Invalid role specified");
  }

  const [newUser] = await db
    .insert(users)
    .values({
      username: data.username,
      displayUsername: data.username,
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      roleId: data.roleId,
      active: data.active,
    })
    .returning();

  if (!newUser) {
    throw new Error("Failed to create user");
  }

  if (hashedPassword) {
    await db.insert(accounts).values({
      userId: newUser.id,
      accountId: newUser.id,
      providerId: "credential",
      password: hashedPassword,
    });
  } else if (data.sendInvite) {
    await requestPasswordSetupInvite(newUser.email);
  }

  await auditLog({
    actorId: currentUserId,
    action: hashedPassword ? "user_created" : "user_invited",
    entityType: "user",
    entityId: newUser.id,
    metadata: {
      username: data.username,
      email: data.email,
      role: role.name,
      inviteSent: !hashedPassword && data.sendInvite,
    },
  });

  const userWithRole = await getUserById(newUser.id);
  if (!userWithRole) {
    throw new Error("Failed to retrieve created user");
  }

  return userWithRole;
}

/**
 * Update a user (optional password update)
 */
export async function updateUser(
  id: string,
  data: UpdateUserData,
  currentUserId: string
): Promise<UserWithRole> {
  // Get existing user for comparison
  const existingUser = await getUserById(id);
  if (!existingUser) {
    throw new Error("User not found");
  }

  // Prepare update data
  const updateData: any = {
    username: data.username,
    email: data.email,
    name: `${data.firstName} ${data.lastName}`,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    roleId: data.roleId,
    active: data.active,
    updatedAt: new Date(),
  };

  // Update user
  await db.update(users).set(updateData).where(eq(users.id, id));

  if (data.password && data.password.trim() !== "") {
    const hashedPassword = await bcrypt.hash(data.password, 6);
    const existingAccount = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(eq(accounts.userId, id), eq(accounts.providerId, "credential"))
      )
      .limit(1);

    const [account] = existingAccount;

    if (!account) {
      await db.insert(accounts).values({
        userId: id,
        accountId: id,
        providerId: "credential",
        passwordHash: hashedPassword,
      });
    } else {
      await db
        .update(accounts)
        .set({ passwordHash: hashedPassword, updatedAt: new Date() })
        .where(eq(accounts.id, account.id));
    }
  }

  // Get role name for audit log
  const [role] = await db
    .select({ name: roles.name })
    .from(roles)
    .where(eq(roles.id, data.roleId))
    .limit(1);

  if (!role) {
    throw new Error("Invalid role specified");
  }

  // Prepare audit details
  const changedFields: Record<string, any> = {};
  if (existingUser.username !== data.username)
    changedFields.username = data.username;
  if (existingUser.email !== data.email) changedFields.email = data.email;
  if (existingUser.firstName !== data.firstName)
    changedFields.firstName = data.firstName;
  if (existingUser.lastName !== data.lastName)
    changedFields.lastName = data.lastName;
  if (existingUser.phone !== data.phone) changedFields.phone = data.phone;
  if (existingUser.roleId !== data.roleId) {
    changedFields.roleChanged = {
      from: existingUser.roleName,
      to: role.name,
    };
  }
  if (existingUser.active !== data.active) {
    changedFields.statusChanged = {
      from: existingUser.active ? "active" : "inactive",
      to: data.active ? "active" : "inactive",
    };
  }
  if (data.password && data.password.trim() !== "") {
    changedFields.passwordChanged = true;
  }

  // Create audit log
  await auditLog({
    actorId: currentUserId,
    action: "user_updated",
    entityType: "user",
    entityId: id,
    metadata: changedFields,
  });

  // Return updated user with role information
  const updatedUser = await getUserById(id);
  if (!updatedUser) {
    throw new Error("Failed to retrieve updated user");
  }

  return updatedUser;
}

/**
 * Soft delete a user (set inactive)
 */
export async function softDeleteUser(
  id: string,
  currentUserId: string
): Promise<void> {
  // Get user info for audit log
  const user = await getUserById(id);
  if (!user) {
    throw new Error("User not found");
  }

  // Set user as inactive
  await db
    .update(users)
    .set({
      active: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));

  // Create audit log
  await auditLog({
    actorId: currentUserId,
    action: "user_deleted",
    entityType: "user",
    entityId: id,
    metadata: {
      username: user.username,
      email: user.email,
      role: user.roleName,
    },
  });
}

/**
 * Hard delete a user from the database
 * Warning: This permanently removes the user record
 */
export async function deleteUser(
  id: string,
  currentUserId: string
): Promise<void> {
  // Get user info for audit log before deletion
  const user = await getUserById(id);
  if (!user) {
    throw new Error("User not found");
  }

  // Create audit log before deletion
  await auditLog({
    actorId: currentUserId,
    action: "user_deleted",
    entityType: "user",
    entityId: id,
    metadata: {
      username: user.username,
      email: user.email,
      role: user.roleName,
      hardDelete: true,
    },
  });

  // Permanently delete user from database
  await db.delete(users).where(eq(users.id, id));
}

/**
 * Update user profile (self-service for current user)
 * Only allows updating: firstName, lastName, email, phone
 */
export async function updateUserProfile(
  userId: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    roleId?: string;
  },
  currentUserId: string,
  currentUserRoleName: string
): Promise<UserWithRole> {
  // Security check: users can only update their own profile
  if (userId !== currentUserId) {
    throw new Error("You can only update your own profile");
  }

  // Get existing user for comparison
  const existingUser = await getUserById(userId);
  if (!existingUser) {
    throw new Error("User not found");
  }

  // Build update payload
  const updatePayload: Record<string, any> = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    name: `${data.firstName} ${data.lastName}`,
    phone: data.phone,
    updatedAt: new Date(),
  };

  // Allow role change only for admin
  if (currentUserRoleName === "admin" && data.roleId) {
    updatePayload.roleId = data.roleId;
  }

  // Update user profile (only allowed fields)
  await db.update(users).set(updatePayload).where(eq(users.id, userId));

  // Prepare audit details
  const changedFields: Record<string, any> = {};
  if (existingUser.firstName !== data.firstName)
    changedFields.firstName = data.firstName;
  if (existingUser.lastName !== data.lastName)
    changedFields.lastName = data.lastName;
  if (existingUser.email !== data.email) changedFields.email = data.email;
  if (existingUser.phone !== data.phone) changedFields.phone = data.phone;
  if (
    currentUserRoleName === "admin" &&
    data.roleId &&
    existingUser.roleId !== data.roleId
  ) {
    const newRole = await db
      .select({ name: roles.name })
      .from(roles)
      .where(eq(roles.id, data.roleId))
      .limit(1);
    changedFields.roleChanged = {
      from: existingUser.roleName,
      to: newRole[0]?.name || "unknown",
    };
  }

  // Create audit log only if there were changes
  if (Object.keys(changedFields).length > 0) {
    await auditLog({
      actorId: currentUserId,
      action: "profile_updated",
      entityType: "user",
      entityId: userId,
      metadata: changedFields,
    });
  }

  // Return updated user with role information
  const updatedUser = await getUserById(userId);
  if (!updatedUser) {
    throw new Error("Failed to retrieve updated user");
  }

  return updatedUser;
}

/**
 * Get all roles for dropdown
 */
export async function getRoles() {
  const rolesList = await db
    .select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
    })
    .from(roles)
    .orderBy(roles.name);

  return rolesList;
}

async function requestPasswordSetupInvite(email: string) {
  const baseUrl =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    "http://localhost:3000";
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const endpoint = `${normalizedBaseUrl}/api/auth/request-password-reset`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      redirectTo: "/reset-password",
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(
      message || "Failed to send password setup email to the new user"
    );
  }
}
