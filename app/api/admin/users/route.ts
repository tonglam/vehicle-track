import { db } from "@/drizzle/db";
import { roles, users } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { createUser, listUsers } from "@/lib/services/user.service";
import { createUserSchema, listUsersSchema } from "@/lib/validations/user.validation";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * GET /api/admin/users
 * List users with pagination
 * Access: Admin and Manager
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user role
    const [user] = await db
      .select({ roleName: roles.name })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user || !["admin", "manager"].includes(user.roleName)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = listUsersSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const offset = (params.page - 1) * params.limit;
    const { users: userList, total } = await listUsers({
      limit: params.limit,
      offset,
    });

    const totalPages = Math.ceil(total / params.limit);

    return NextResponse.json({
      users: userList,
      total,
      page: params.page,
      totalPages,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user
 * Access: Admin only
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user role - admin only
    const [user] = await db
      .select({ roleName: roles.name })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user || user.roleName !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions. Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Create user (password will be hashed in service)
    const newUser = await createUser(
      {
        username: validatedData.username,
        email: validatedData.email,
        phone: validatedData.phone,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        password: validatedData.password,
        roleId: validatedData.roleId,
        active: validatedData.active,
        sendInvite: validatedData.sendInvite,
      },
      session.user.id
    );

    return NextResponse.json(
      {
        success: true,
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
