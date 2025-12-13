import { getSupabaseAdmin, generateInspectionImagePath, STORAGE_BUCKET_NAME } from "@/lib/storage";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const section = (formData.get("section") as string | null) ?? "supporting-images";

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const path = generateInspectionImagePath(
      session.user.id,
      section,
      file.name
    );

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(path, buffer, {
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
        upsert: false,
      });

    if (error || !data) {
      console.error("Inspection image upload failed:", error);
      return NextResponse.json(
        { error: error?.message || "Failed to upload image" },
        { status: 400 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET_NAME).getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl, path: data.path });
  } catch (error) {
    console.error("Error uploading inspection image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
