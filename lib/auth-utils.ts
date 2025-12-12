import { db } from "@/drizzle/db";
import { roles, users } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Get full user with role
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      roleId: users.roleId,
      roleName: roles.name,
      active: users.active,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user || !user.active) {
    redirect("/login");
  }

  return { session, user };
}

export async function requireRole(allowedRoles: string[]) {
  const { user } = await requireAuth();

  if (!allowedRoles.includes(user.roleName)) {
    throw new Error("Insufficient permissions");
  }

  return user;
}

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}
