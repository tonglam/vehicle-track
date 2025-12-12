import * as schema from "@/drizzle/schema";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

// User types
export type User = InferSelectModel<typeof schema.users>;
export type NewUser = InferInsertModel<typeof schema.users>;

// Role types
export type Role = InferSelectModel<typeof schema.roles>;

// Vehicle types
export type Vehicle = InferSelectModel<typeof schema.vehicles>;
export type NewVehicle = InferInsertModel<typeof schema.vehicles>;

// Vehicle Group types
export type VehicleGroup = InferSelectModel<typeof schema.vehicleGroups>;
export type NewVehicleGroup = InferInsertModel<typeof schema.vehicleGroups>;

// Driver types
export type Driver = InferSelectModel<typeof schema.drivers>;
export type NewDriver = InferInsertModel<typeof schema.drivers>;

// Inspection types
export type Inspection = InferSelectModel<typeof schema.inspections>;
export type NewInspection = InferInsertModel<typeof schema.inspections>;

// Agreement types
export type Agreement = InferSelectModel<typeof schema.agreements>;
export type NewAgreement = InferInsertModel<typeof schema.agreements>;

// Agreement Template types
export type AgreementTemplate = InferSelectModel<
  typeof schema.agreementTemplates
>;
export type NewAgreementTemplate = InferInsertModel<
  typeof schema.agreementTemplates
>;

// Audit Log types
export type AuditLog = InferSelectModel<typeof schema.auditLogs>;
export type NewAuditLog = InferInsertModel<typeof schema.auditLogs>;
