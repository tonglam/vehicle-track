-- Setup Storage Policies for Vehicle Track Bucket
-- This script sets up Row Level Security (RLS) policies for file uploads

-- First, ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-track',
  'vehicle-track', 
  true,  -- Make it public so files are accessible
  10485760,  -- 10MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated uploads to vehicle-track" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to vehicle-track" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from vehicle-track" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from vehicle-track" ON storage.objects;

-- Create simple policies that work with Better Auth
-- These allow any authenticated user to upload, update, and delete
-- Access control is handled at the application level

CREATE POLICY "Allow authenticated uploads to vehicle-track"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-track');

CREATE POLICY "Allow authenticated updates to vehicle-track"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vehicle-track');

CREATE POLICY "Allow authenticated deletes from vehicle-track"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vehicle-track');

CREATE POLICY "Allow public reads from vehicle-track"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vehicle-track');

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE '%vehicle-track%';
