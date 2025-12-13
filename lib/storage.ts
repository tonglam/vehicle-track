import { createClient } from "@supabase/supabase-js";

const envSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!envSupabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
}

const supabaseUrl = envSupabaseUrl;

// Support both old and new env variable names for backward compatibility
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) is not defined"
  );
}

// Client for public operations
export const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Admin client for server-side operations (bypasses RLS)
// Only use this in server-side API routes, never expose to client
let adminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (adminClient) return adminClient;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not defined. Required for server-side storage operations."
    );
  }

  adminClient = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return adminClient;
}

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name
 * @param path - The path within the bucket
 * @param useAdmin - Whether to use admin client (bypasses RLS, for server-side only)
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(
  file: File,
  bucket: string,
  path: string,
  useAdmin = false
): Promise<{ url: string; error?: string }> {
  try {
    // Choose client based on context
    const client = useAdmin ? getSupabaseAdmin() : supabaseClient;

    // Upload the file
    const { data, error } = await client.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true, // Replace existing file
      });

    if (error) {
      console.error("Upload error:", error);
      return { url: "", error: error.message };
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = client.storage.from(bucket).getPublicUrl(data.path);

    return { url: publicUrl };
  } catch (error: any) {
    console.error("Upload exception:", error);
    return { url: "", error: error.message };
  }
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The path within the bucket
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseClient.storage.from(bucket).remove([path]);

    if (error) {
      console.error("Delete error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Delete exception:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate a unique file path for organization logos
 * @param userId - The user ID
 * @param fileName - The original file name
 * @returns Path in format: organizations/{userId}/logo-{timestamp}.{ext}
 */
export function generateOrgLogoPath(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const ext = fileName.split(".").pop();
  return `organizations/${userId}/logo-${timestamp}.${ext}`;
}

/**
 * Generate a unique file path for vehicle attachments
 * @param userId - The user ID who is uploading
 * @param fileName - The original file name
 * @returns Path in format: vehicles/attachments/{userId}/{timestamp}-{sanitizedFileName}
 */
export function generateVehicleAttachmentPath(
  userId: string,
  fileName: string
): string {
  const timestamp = Date.now();
  // Sanitize filename: remove special characters except dots and dashes
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `vehicles/attachments/${userId}/${timestamp}-${sanitizedFileName}`;
}

export function generateInspectionImagePath(
  userId: string,
  section: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedSection = section.replace(/[^a-z0-9_-]/gi, "_");
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `inspections/${sanitizedSection}/${userId}/${timestamp}-${sanitizedFileName}`;
}

/**
 * Storage Bucket Folder Structure:
 *
 * vehicle-track/
 * ├── organizations/
 * │   └── {userId}/
 * │       └── logo-{timestamp}.{ext}
 * │
 * └── vehicles/
 *     └── attachments/
 *         └── {userId}/
 *             └── {timestamp}-{filename}
 */

// Default bucket name for all assets
export const STORAGE_BUCKET_NAME =
  process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || "vehicle-track";
