ALTER TABLE "agreements" ADD COLUMN IF NOT EXISTS "final_content_richtext" text;
ALTER TABLE "agreements" ADD COLUMN IF NOT EXISTS "signing_token" text;
