import { db } from "@/drizzle/db";
import {
  contractorVehicleChecks,
  drivers,
  users,
  vehicles,
} from "@/drizzle/schema";
import type {
  ComplianceActivityItem,
  ComplianceSummaryMetrics,
  ContractorCheckListItem,
  ContractorCheckSummary,
} from "@/types";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

export interface ComplianceDashboardFilters {
  startDate: Date;
  endDate: Date;
}

export interface ComplianceDashboardData {
  metrics: ComplianceSummaryMetrics;
  activity: ComplianceActivityItem[];
}

export async function getComplianceDashboardData(
  filters: ComplianceDashboardFilters
): Promise<ComplianceDashboardData> {
  const { startDate, endDate } = filters;
  const startBoundary = toDateOnly(startDate);
  const endBoundary = toDateOnly(endDate);
  const rangeFilter = and(
    gte(contractorVehicleChecks.cycleWeekStart, startBoundary),
    lte(contractorVehicleChecks.cycleWeekStart, endBoundary)
  );

  const [metricsRow] = await db
    .select({
      total: sql<number>`count(*)::int`,
      openChecks: sql<number>`sum(case when ${contractorVehicleChecks.status} = 'pending' then 1 else 0 end)::int`,
      completedChecks: sql<number>`sum(case when ${contractorVehicleChecks.status} = 'complete' then 1 else 0 end)::int`,
      pendingSubmissions: sql<number>`sum(case when ${contractorVehicleChecks.submittedAt} is null then 1 else 0 end)::int`,
    })
    .from(contractorVehicleChecks)
    .where(rangeFilter);

  const totalChecks = metricsRow?.total ?? 0;
  const openChecks = metricsRow?.openChecks ?? 0;
  const completedChecks = metricsRow?.completedChecks ?? 0;
  const pendingSubmissions = metricsRow?.pendingSubmissions ?? 0;
  const completionRate =
    totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;

  const activityRows = await db
    .select({
      id: contractorVehicleChecks.id,
      status: contractorVehicleChecks.status,
      submittedAt: contractorVehicleChecks.submittedAt,
      updatedAt: contractorVehicleChecks.updatedAt,
      cycleWeekStart: contractorVehicleChecks.cycleWeekStart,
      driverFirstName: drivers.firstName,
      driverLastName: drivers.lastName,
      vehicleLicense: vehicles.licensePlate,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      vehicleYear: vehicles.year,
      completedByFirstName: users.firstName,
      completedByLastName: users.lastName,
    })
    .from(contractorVehicleChecks)
    .leftJoin(drivers, eq(contractorVehicleChecks.driverId, drivers.id))
    .leftJoin(vehicles, eq(contractorVehicleChecks.vehicleId, vehicles.id))
    .leftJoin(users, eq(contractorVehicleChecks.completedBy, users.id))
    .where(rangeFilter)
    .orderBy(desc(contractorVehicleChecks.updatedAt))
    .limit(5);

  const activity: ComplianceActivityItem[] = activityRows.map((row) => ({
    id: row.id,
    driverName: formatName(
      row.driverFirstName,
      row.driverLastName,
      "Unassigned driver"
    ),
    vehicleLabel: formatVehicleLabel(
      row.vehicleLicense,
      row.vehicleYear,
      row.vehicleMake,
      row.vehicleModel
    ),
    status: row.status,
    submittedAt: row.submittedAt,
    updatedAt: row.updatedAt,
    completedBy:
      row.completedByFirstName || row.completedByLastName
        ? formatName(row.completedByFirstName, row.completedByLastName)
        : null,
    cycleWeekStart: parseDateValue(row.cycleWeekStart),
  }));

  const metrics: ComplianceSummaryMetrics = {
    totalChecks,
    openChecks,
    completedChecks,
    pendingSubmissions,
    completionRate,
  };

  return { metrics, activity };
}

export interface ContractorCheckFilters {
  cycleWeekStart: string;
  search?: string;
  status?: "pending" | "complete";
}

export interface ContractorCheckListResult {
  checks: ContractorCheckListItem[];
  summary: ContractorCheckSummary;
  filteredSummary: ContractorCheckSummary;
}

export async function getContractorCheckWeeks(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ week: contractorVehicleChecks.cycleWeekStart })
    .from(contractorVehicleChecks)
    .orderBy(desc(contractorVehicleChecks.cycleWeekStart));

  const weeks = rows
    .map((row) => row.week)
    .filter((week): week is string => Boolean(week));

  // If no cycles exist, return the default weeks to display empty state
  if (weeks.length === 0) {
    return ["2025-12-03", "2025-11-26", "2025-11-19"];
  }

  return weeks;
}

export async function getContractorChecks(
  filters: ContractorCheckFilters
): Promise<ContractorCheckListResult> {
  const { cycleWeekStart, search, status } = filters;
  const rows = await db
    .select({
      id: contractorVehicleChecks.id,
      status: contractorVehicleChecks.status,
      submittedAt: contractorVehicleChecks.submittedAt,
      updatedAt: contractorVehicleChecks.updatedAt,
      cycleWeekStart: contractorVehicleChecks.cycleWeekStart,
      driverFirstName: drivers.firstName,
      driverLastName: drivers.lastName,
      driverEmail: drivers.email,
      driverPhone: drivers.phone,
      vehicleId: vehicles.id,
      vehicleLicense: vehicles.licensePlate,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      vehicleYear: vehicles.year,
    })
    .from(contractorVehicleChecks)
    .leftJoin(drivers, eq(contractorVehicleChecks.driverId, drivers.id))
    .leftJoin(vehicles, eq(contractorVehicleChecks.vehicleId, vehicles.id))
    .where(eq(contractorVehicleChecks.cycleWeekStart, cycleWeekStart))
    .orderBy(desc(contractorVehicleChecks.updatedAt));

  const items: ContractorCheckListItem[] = rows
    .filter((row) => row.id && row.cycleWeekStart)
    .map((row) => ({
    id: row.id,
      driverName: formatName(
        row.driverFirstName,
        row.driverLastName,
        "Unassigned driver"
      ),
    driverEmail: row.driverEmail ?? null,
    driverPhone: row.driverPhone ?? null,
    vehicleLabel: formatVehicleLabel(
      row.vehicleLicense,
      row.vehicleYear,
      row.vehicleMake,
      row.vehicleModel
    ),
    vehicleId: row.vehicleId ?? "",
    status: row.status,
    submittedAt: row.submittedAt,
    updatedAt: row.updatedAt,
      cycleWeekStart: row.cycleWeekStart!,
  }));

  const summary = summarizeChecks(items);

  const trimmedSearch = search?.trim().toLowerCase();
  const searchFiltered = trimmedSearch
    ? items.filter((item) => {
        const haystack =
          `${item.driverName} ${item.driverEmail ?? ""} ${item.driverPhone ?? ""} ${item.vehicleLabel}`.toLowerCase();
        return haystack.includes(trimmedSearch);
      })
    : items;

  const filteredSummary = summarizeChecks(searchFiltered);

  const normalizedStatus =
    status === "complete" || status === "pending" ? status : undefined;
  const resultChecks = normalizedStatus
    ? searchFiltered.filter((item) => item.status === normalizedStatus)
    : searchFiltered;

  return {
    checks: resultChecks,
    summary,
    filteredSummary,
  };
}

function formatName(
  firstName: string | null,
  lastName: string | null,
  fallback = "Unknown"
) {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name.length > 0 ? name : fallback;
}

function formatVehicleLabel(
  license: string | null,
  year: number | null,
  make: string | null,
  model: string | null
) {
  const descriptor = [year ?? undefined, make, model]
    .filter(
      (part) =>
        part !== undefined && part !== null && `${part}`.trim().length > 0
    )
    .join(" ");

  if (license && descriptor) {
    return `${license} • ${descriptor}`;
  }
  if (license) {
    return license;
  }
  if (descriptor) {
    return descriptor;
  }
  return "Vehicle details unavailable";
}

function summarizeChecks(
  items: ContractorCheckListItem[]
): ContractorCheckSummary {
  const total = items.length;
  const completed = items.filter((item) => item.status === "complete").length;
  const pending = items.filter((item) => item.status === "pending").length;
  return { total, completed, pending };
}

function toDateOnly(date: Date) {
  const offsetMinutes = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offsetMinutes * 60000);
  const [isoDate] = adjusted.toISOString().split("T");
  return isoDate ?? adjusted.toISOString();
}

function parseDateValue(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}
