import { auth } from "@/lib/auth";
import {
  generateOrgLogoPath,
  STORAGE_BUCKET_NAME,
  uploadFile,
} from "@/lib/storage";
import { NextRequest, NextResponse } from "next/server";

// Supabase free tier allows up to 50MB, but we restrict logos to 5MB for performance
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (adjust up to 50MB if needed)
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif"];

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    console.log("📤 Uploading logo for user:", session.user.id);
    console.log("File:", file.name, file.type, `${file.size} bytes`);

    // Generate unique path for the file (organizations/{userId}/logo-{timestamp}.{ext})
    const filePath = generateOrgLogoPath(session.user.id, file.name);

    // Upload to Supabase Storage using admin client (bypasses RLS)
    const { url, error } = await uploadFile(
      file,
      STORAGE_BUCKET_NAME,
      filePath,
      true // Use admin client
    );

    if (error) {
      console.error("❌ Upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload file", details: error },
        { status: 500 }
      );
    }

    console.log("✅ Upload successful:", url);

    return NextResponse.json({
      success: true,
      url: url,
      path: filePath,
    });
  } catch (error: any) {
    console.error("❌ Upload exception:", error);
    return NextResponse.json(
      { error: "Failed to upload file", message: error.message },
      { status: 500 }
    );
  }
}
