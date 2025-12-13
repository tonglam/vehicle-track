import { auth } from "@/lib/auth";
import { getUserById, updateUserProfile } from "@/lib/services/user.service";
import { updateProfileSchema } from "@/lib/validations/user.validation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * PUT /api/profile
 * Update current user's profile
 * Access: Any authenticated user (edits only their own profile)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch current user to know role (for admin-only role updates)
    const currentUser = await getUserById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Update user profile (service enforces user can only update their own)
    const updatedUser = await updateUserProfile(
      session.user.id,
      {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        // Only admins can change role; non-admins are ignored in service guard
        roleId: validatedData.roleId,
      },
      session.user.id,
      currentUser.roleName
    );

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    if (
      error instanceof Error &&
      error.message === "You can only update your own profile"
    ) {
      return NextResponse.json(
        { error: "Forbidden: You can only update your own profile" },
        { status: 403 }
      );
    }
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

