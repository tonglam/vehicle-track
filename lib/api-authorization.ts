import { db } from "@/drizzle/db";
import { roles, users } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import {
  isRoleAllowed,
  type ApplicationRole,
} from "@/lib/authorization-policy";
import { eq } from "drizzle-orm";

export type AuthorizedApiUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
};

type AuthorizationResult =
  | { status: 200; user: AuthorizedApiUser }
  | { status: 401 | 403; error: string };

export async function authorizeApiRequest(
  requestHeaders: Headers,
  allowedRoles: readonly ApplicationRole[],
): Promise<AuthorizationResult> {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user) {
    return { status: 401, error: "Unauthorized" };
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      roleName: roles.name,
      active: users.active,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.active || !isRoleAllowed(user.roleName, allowedRoles)) {
    return { status: 403, error: "Insufficient permissions" };
  }

  return { status: 200, user };
}
