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

// Vehicle with Group information
export interface VehicleWithGroup extends Vehicle {
  groupName: string | null;
}

export interface VehicleOption {
  id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  licensePlate: string;
  status: Vehicle["status"];
  ownership: Vehicle["ownership"];
}

// Vehicle Group types
export type VehicleGroup = InferSelectModel<typeof schema.vehicleGroups>;
export type NewVehicleGroup = InferInsertModel<typeof schema.vehicleGroups>;

export interface VehicleGroupWithStats extends VehicleGroup {
  totalVehicles: number;
  activeVehicles: number;
  assignedManagers: number;
}

export interface VehicleGroupDetail extends VehicleGroup {
  totalVehicles: number;
  activeVehicles: number;
  assignedManagerIds: string[];
  assignedManagers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  vehicles: VehicleWithGroup[];
  createdByName: string;
}

export interface CreateVehicleGroupInput {
  name: string;
  description?: string;
  contractId?: string;
  areaManagerContact?: string;
  signatureMode?: "dual" | "supervisor_only";
}

export interface UpdateVehicleGroupInput {
  name?: string;
  description?: string;
  contractId?: string;
  areaManagerContact?: string;
  signatureMode?: "dual" | "supervisor_only";
}

// Driver types
export type Driver = InferSelectModel<typeof schema.drivers>;
export type NewDriver = InferInsertModel<typeof schema.drivers>;

export interface DriverListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
}

export interface DriverAgreementSummary {
  id: string;
  templateTitle: string;
  status: string;
  createdAt: Date | null;
  signedAt: Date | null;
  vehicleName: string;
  licensePlate: string;
}

export interface DriverDetail extends Driver {
  stats: {
    totalAgreements: number;
    activeAgreements: number;
  };
  agreements: DriverAgreementSummary[];
}

export interface CreateDriverInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export type UpdateDriverInput = CreateDriverInput;

// Inspection types
export type Inspection = InferSelectModel<typeof schema.inspections>;
export type NewInspection = InferInsertModel<typeof schema.inspections>;

export interface InspectionListItem {
  id: string;
  vehicleId: string;
  vehicleLicensePlate: string | null;
  vehicleDisplayName: string | null;
  status: Inspection["status"];
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date | null;
  inspectorName: string | null;
}

// Agreement types
export type Agreement = InferSelectModel<typeof schema.agreements>;
export type NewAgreement = InferInsertModel<typeof schema.agreements>;

export interface AgreementListItem {
  id: string;
  templateTitle: string;
  vehicleDisplayName: string;
  licensePlate: string;
  status: Agreement["status"];
  createdAt: Date;
  updatedAt: Date;
  signedAt: Date | null;
  signedBy: string | null;
}

// Agreement Template types
export type AgreementTemplate = InferSelectModel<
  typeof schema.agreementTemplates
>;
export type NewAgreementTemplate = InferInsertModel<
  typeof schema.agreementTemplates
>;

export interface AgreementTemplateSummary {
  id: string;
  title: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Compliance types
export type ContractorVehicleCheck = InferSelectModel<
  typeof schema.contractorVehicleChecks
>;
export type NewContractorVehicleCheck = InferInsertModel<
  typeof schema.contractorVehicleChecks
>;

export interface ComplianceSummaryMetrics {
  totalChecks: number;
  openChecks: number;
  completedChecks: number;
  pendingSubmissions: number;
  completionRate: number;
}

export interface ComplianceActivityItem {
  id: string;
  driverName: string;
  vehicleLabel: string;
  status: ContractorVehicleCheck["status"];
  submittedAt: Date | null;
  updatedAt: Date;
  completedBy: string | null;
  cycleWeekStart: Date;
}

export interface ContractorCheckListItem {
  id: string;
  driverName: string;
  driverEmail: string | null;
  driverPhone: string | null;
  vehicleLabel: string;
  vehicleId: string;
  status: ContractorVehicleCheck["status"];
  submittedAt: Date | null;
  updatedAt: Date;
  cycleWeekStart: string;
}

export interface ContractorCheckSummary {
  total: number;
  completed: number;
  pending: number;
}

// Audit Log types
export type AuditLog = InferSelectModel<typeof schema.auditLogs>;
export type NewAuditLog = InferInsertModel<typeof schema.auditLogs>;

// Verification types
export type Verification = InferSelectModel<typeof schema.verifications>;
export type NewVerification = InferInsertModel<typeof schema.verifications>;

// User Management types
export interface UserWithRole {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  roleId: string;
  roleName: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  username: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password?: string;
  confirmPassword?: string;
  roleId: string;
  active: boolean;
  sendInvite: boolean;
}

export interface UpdateUserInput {
  username: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password?: string;
  confirmPassword?: string;
  roleId: string;
  active: boolean;
}

export interface RoleOption {
  id: string;
  name: string;
  description: string | null;
}

// Email Config types
export type EmailConfig = InferSelectModel<typeof schema.emailConfigs>;
export type NewEmailConfig = InferInsertModel<typeof schema.emailConfigs>;

export interface EmailConfigForm {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  active: boolean;
}
