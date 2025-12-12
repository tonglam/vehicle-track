-- =========================================
-- Vehicle Track - Supabase Schema (MVP)
-- =========================================
-- Run this script in Supabase SQL Editor
-- Based on: documentation/data-models.md

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================
-- ENUMS
-- =========================================

CREATE TYPE role_name AS ENUM ('admin', 'manager', 'inspector', 'viewer');

CREATE TYPE vehicle_status AS ENUM (
  'available',
  'assigned',
  'maintenance',
  'temporarily_assigned',
  'leased_out',
  'retired',
  'sold'
);

CREATE TYPE ownership_type AS ENUM ('owned', 'external', 'leased_out');

CREATE TYPE fuel_type AS ENUM ('petrol', 'diesel', 'electric', 'hybrid', 'lpg');

CREATE TYPE transmission_type AS ENUM ('manual', 'automatic', 'cvt', 'semi_automatic');

CREATE TYPE inspection_status AS ENUM ('draft', 'submitted');

CREATE TYPE inspection_image_section AS ENUM ('exterior', 'interior', 'mechanical');

CREATE TYPE agreement_status AS ENUM ('draft', 'pending_signature', 'signed', 'terminated');

CREATE TYPE driver_agreement_role AS ENUM ('signer', 'viewer');

CREATE TYPE contractor_check_status AS ENUM ('pending', 'complete');

-- =========================================
-- TABLES
-- =========================================

-- Auth & Roles
-- =========================================

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name role_name NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  password_hash TEXT NOT NULL, -- managed by Better Auth
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE email_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL,
  smtp_username TEXT NOT NULL,
  smtp_password_enc TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fleet
-- =========================================

CREATE TABLE vehicle_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  contract_id TEXT,
  area_manager_contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  vin TEXT NOT NULL,
  status vehicle_status NOT NULL DEFAULT 'available',
  ownership ownership_type NOT NULL,
  owner_company TEXT,
  fuel_type fuel_type NOT NULL,
  transmission transmission_type NOT NULL,
  engine_size_l NUMERIC,
  odometer NUMERIC,
  purchase_date DATE,
  last_service_date DATE,
  next_service_due DATE,
  notes TEXT,
  group_id UUID REFERENCES vehicle_groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE vehicle_group_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES vehicle_groups(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, manager_id)
);

CREATE TABLE vehicle_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

-- Drivers
-- =========================================

CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

-- Inspections
-- =========================================

CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  inspector_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status inspection_status NOT NULL DEFAULT 'draft',
  exterior_condition TEXT NOT NULL,
  interior_condition TEXT NOT NULL,
  mechanical_condition TEXT NOT NULL,
  additional_notes TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inspection_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  section inspection_image_section NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

-- Agreements
-- =========================================

CREATE TABLE agreement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content_richtext TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  inspection_id UUID NOT NULL UNIQUE REFERENCES inspections(id) ON DELETE RESTRICT,
  template_id UUID NOT NULL REFERENCES agreement_templates(id) ON DELETE RESTRICT,
  status agreement_status NOT NULL DEFAULT 'draft',
  signed_by_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE driver_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
  role driver_agreement_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(driver_id, agreement_id, role)
);

-- Compliance
-- =========================================

CREATE TABLE contractor_vehicle_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  cycle_week_start DATE NOT NULL,
  status contractor_check_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(driver_id, vehicle_id, cycle_week_start)
);

-- Audit & Activity
-- =========================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- INDEXES
-- =========================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_active ON users(active);

-- Vehicles
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_group ON vehicles(group_id);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE INDEX idx_vehicles_updated_at ON vehicles(updated_at DESC);

-- Contractor Vehicle Checks
CREATE INDEX idx_cvc_cycle_week ON contractor_vehicle_checks(cycle_week_start);
CREATE INDEX idx_cvc_status ON contractor_vehicle_checks(status);
CREATE INDEX idx_cvc_driver ON contractor_vehicle_checks(driver_id);
CREATE INDEX idx_cvc_vehicle ON contractor_vehicle_checks(vehicle_id);

-- Audit Logs
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);

-- =========================================
-- TRIGGERS (updated_at)
-- =========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_configs_updated_at
  BEFORE UPDATE ON email_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_groups_updated_at
  BEFORE UPDATE ON vehicle_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at
  BEFORE UPDATE ON inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agreement_templates_updated_at
  BEFORE UPDATE ON agreement_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agreements_updated_at
  BEFORE UPDATE ON agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contractor_vehicle_checks_updated_at
  BEFORE UPDATE ON contractor_vehicle_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- SEED DATA
-- =========================================

INSERT INTO roles (name, description) VALUES
  ('admin', 'Full system access including user management'),
  ('manager', 'Manage fleet, drivers, and compliance; cannot modify users'),
  ('inspector', 'Read-only access across all modules'),
  ('viewer', 'Read-only access across all modules')
ON CONFLICT (name) DO NOTHING;

-- =========================================
-- END
-- =========================================
