import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// =========================================
// ENUMS
// =========================================

export const roleNameEnum = pgEnum("role_name", [
  "admin",
  "manager",
  "inspector",
  "viewer",
]);

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "available",
  "assigned",
  "maintenance",
  "temporarily_assigned",
  "leased_out",
  "retired",
  "sold",
]);

export const ownershipTypeEnum = pgEnum("ownership_type", [
  "owned",
  "external",
  "leased_out",
]);

export const fuelTypeEnum = pgEnum("fuel_type", [
  "petrol",
  "diesel",
  "electric",
  "hybrid",
  "lpg",
]);

export const transmissionTypeEnum = pgEnum("transmission_type", [
  "manual",
  "automatic",
  "cvt",
  "semi_automatic",
]);

export const inspectionStatusEnum = pgEnum("inspection_status", [
  "draft",
  "submitted",
]);

export const inspectionImageSectionEnum = pgEnum("inspection_image_section", [
  "exterior",
  "interior",
  "mechanical",
]);

export const agreementStatusEnum = pgEnum("agreement_status", [
  "draft",
  "pending_signature",
  "signed",
  "terminated",
]);

export const driverAgreementRoleEnum = pgEnum("driver_agreement_role", [
  "signer",
  "viewer",
]);

export const contractorCheckStatusEnum = pgEnum("contractor_check_status", [
  "pending",
  "complete",
]);

// =========================================
// TABLES
// =========================================

// Auth & Roles
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: roleNameEnum("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // Additional custom fields
  username: text("username").notNull().unique(),
  displayUsername: text("display_username"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "restrict" }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  password: text("password"), // Added for Better Auth credential storage
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verification", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull().unique(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const emailConfigs = pgTable("email_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  smtpHost: text("smtp_host").notNull(),
  smtpPort: integer("smtp_port").notNull(),
  smtpUsername: text("smtp_username").notNull(),
  smtpPasswordEnc: text("smtp_password_enc").notNull(),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Organizations
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  updatedBy: uuid("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

// Fleet
export const vehicleGroups = pgTable("vehicle_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type"),
  contractId: text("contract_id"),
  areaManagerContact: text("area_manager_contact"),
  signatureMode: text("signature_mode").notNull().default("dual"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
});

export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  year: integer("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  licensePlate: text("license_plate").notNull(),
  vin: text("vin").notNull(),
  status: vehicleStatusEnum("status").notNull().default("available"),
  ownership: ownershipTypeEnum("ownership").notNull(),
  ownerCompany: text("owner_company"),
  fuelType: fuelTypeEnum("fuel_type").notNull(),
  transmission: transmissionTypeEnum("transmission").notNull(),
  engineSizeL: numeric("engine_size_l"),
  odometer: numeric("odometer"),
  purchaseDate: date("purchase_date"),
  lastServiceDate: date("last_service_date"),
  nextServiceDue: date("next_service_due"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: uuid("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

// Vehicle-to-Group assignments (which vehicles belong to which groups)
export const vehicleGroupAssignments = pgTable("vehicle_group_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  groupId: uuid("group_id")
    .notNull()
    .references(() => vehicleGroups.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  assignedBy: uuid("assigned_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
});

// Manager-to-Group assignments (which managers manage which groups) - Future use
export const groupManagerAssignments = pgTable("group_manager_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => vehicleGroups.id, { onDelete: "cascade" }),
  managerId: uuid("manager_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vehicleAttachments = pgTable("vehicle_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  contentType: text("content_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
});

// Drivers
export const drivers = pgTable("drivers", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
});

// Inspections
export const inspections = pgTable("inspections", {
  id: uuid("id").primaryKey().defaultRandom(),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "restrict" }),
  inspectorId: uuid("inspector_id").references(() => users.id, {
    onDelete: "set null",
  }),
  status: inspectionStatusEnum("status").notNull().default("draft"),
  exteriorCondition: text("exterior_condition").notNull(),
  interiorCondition: text("interior_condition").notNull(),
  mechanicalCondition: text("mechanical_condition").notNull(),
  additionalNotes: text("additional_notes"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const inspectionImages = pgTable("inspection_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  inspectionId: uuid("inspection_id")
    .notNull()
    .references(() => inspections.id, { onDelete: "cascade" }),
  section: inspectionImageSectionEnum("section").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  contentType: text("content_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
});

// Agreements
export const agreementTemplates = pgTable("agreement_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  contentRichtext: text("content_richtext").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
});

export const agreements = pgTable("agreements", {
  id: uuid("id").primaryKey().defaultRandom(),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "restrict" }),
  inspectionId: uuid("inspection_id")
    .notNull()
    .references(() => inspections.id, { onDelete: "restrict" }),
  templateId: uuid("template_id")
    .notNull()
    .references(() => agreementTemplates.id, { onDelete: "restrict" }),
  status: agreementStatusEnum("status").notNull().default("draft"),
  signedByDriverId: uuid("signed_by_driver_id").references(() => drivers.id, {
    onDelete: "set null",
  }),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  finalContentRichtext: text("final_content_richtext"),
  signingToken: text("signing_token"),
  driverSignatureData: text("driver_signature_data"),
});

export const driverAgreements = pgTable("driver_agreements", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverId: uuid("driver_id")
    .notNull()
    .references(() => drivers.id, { onDelete: "cascade" }),
  agreementId: uuid("agreement_id")
    .notNull()
    .references(() => agreements.id, { onDelete: "cascade" }),
  role: driverAgreementRoleEnum("role").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Compliance
export const contractorVehicleChecks = pgTable("contractor_vehicle_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverId: uuid("driver_id")
    .notNull()
    .references(() => drivers.id, { onDelete: "restrict" }),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "restrict" }),
  cycleWeekStart: date("cycle_week_start").notNull(),
  status: contractorCheckStatusEnum("status").notNull().default("pending"),
  submittedAt: timestamp("submitted_at"),
  completedAt: timestamp("completed_at"),
  completedBy: uuid("completed_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Audit & Activity
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => users.id, {
    onDelete: "set null",
  }),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
