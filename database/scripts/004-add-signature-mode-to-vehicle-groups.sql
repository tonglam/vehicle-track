-- Add signature_mode column to vehicle_groups table
-- This field controls which signature panels appear on contractor vehicle checklists

-- Add the column with default value
ALTER TABLE vehicle_groups
ADD COLUMN IF NOT EXISTS signature_mode TEXT NOT NULL DEFAULT 'dual';

-- Add check constraint to ensure valid values
ALTER TABLE vehicle_groups
ADD CONSTRAINT signature_mode_check
CHECK (signature_mode IN ('dual', 'supervisor_only'));

-- Add comment to explain the column
COMMENT ON COLUMN vehicle_groups.signature_mode IS 'Controls signature requirements for contractor checklists: dual (driver + supervisor) or supervisor_only';
