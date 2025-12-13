import { db } from "@/drizzle/db";
import { organizations } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for organization updates
const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  logoUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      console.log("❌ Unauthorized: No session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("📝 Received organization data:", body);

    const validatedData = organizationSchema.parse(body);
    console.log("✅ Validation passed:", validatedData);

    // Check if organization already exists for this user
    console.log("🔍 Checking for existing organization...");
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.createdBy, session.user.id))
      .limit(1);

    console.log(`Found ${existingOrg.length} existing organization(s)`);

    if (existingOrg.length > 0) {
      // Update existing organization
      console.log("🔄 Updating existing organization:", existingOrg[0]!.id);
      const updatedOrg = await db
        .update(organizations)
        .set({
          name: validatedData.name,
          logoUrl: validatedData.logoUrl,
          updatedAt: new Date(),
          updatedBy: session.user.id,
        })
        .where(eq(organizations.id, existingOrg[0]!.id))
        .returning();

      console.log("✅ Organization updated successfully:", updatedOrg[0]);
      return NextResponse.json({
        success: true,
        organization: updatedOrg[0],
      });
    } else {
      // Create new organization
      console.log("➕ Creating new organization for user:", session.user.id);
      const newOrg = await db
        .insert(organizations)
        .values({
          name: validatedData.name,
          logoUrl: validatedData.logoUrl,
          createdBy: session.user.id,
          updatedBy: session.user.id,
        })
        .returning();

      console.log("✅ Organization created successfully:", newOrg[0]);
      return NextResponse.json({
        success: true,
        organization: newOrg[0],
      });
    }
  } catch (error: any) {
    console.error("❌ Error saving organization:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);

    if (error instanceof z.ZodError) {
      console.error("Zod validation errors:", error.issues);
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to save organization",
        message: error.message,
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      console.log("❌ GET: Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 GET: Fetching organization for user:", session.user.id);

    // Get the organization created by this user
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.createdBy, session.user.id))
      .limit(1);

    console.log(`Found ${org.length} organization(s) for user`);

    if (org.length === 0) {
      console.log("No organization found, returning null");
      return NextResponse.json({ organization: null });
    }

    console.log("✅ Returning organization:", org[0]);
    return NextResponse.json({ organization: org[0] });
  } catch (error: any) {
    console.error("❌ Error fetching organization:", error);
    console.error("Error message:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch organization", message: error.message },
      { status: 500 }
    );
  }
}
