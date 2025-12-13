import { requireAuth } from "@/lib/auth-utils";
import { listAgreements } from "@/lib/services/agreement.service";
import { listInspections } from "@/lib/services/inspection.service";
import { listVehicles } from "@/lib/services/vehicle.service";
import Link from "next/link";

const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return dateFormatter.format(value);
}

function formatStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function DashboardPage() {
  const { user } = await requireAuth();
  const [vehicleResult, inspectionResult, agreementResult] = await Promise.all([
    listVehicles({ limit: 5, offset: 0 }),
    listInspections({ limit: 5, offset: 0 }),
    listAgreements({ limit: 5, offset: 0 }),
  ]);

  const recentVehicles = vehicleResult.vehicles;
  const recentInspections = inspectionResult.inspections;
  const recentAgreements = agreementResult.agreements;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <RecentListCard
          title="Recent Vehicles"
          href="/dashboard/vehicles"
          emptyMessage="No vehicles yet"
          items={recentVehicles.map((vehicle) => ({
            id: vehicle.id,
            primary: vehicle.licensePlate,
            secondary: [vehicle.year, vehicle.make, vehicle.model]
              .filter(Boolean)
              .join(" ") || "Unknown vehicle",
            meta: `Updated ${formatDate(vehicle.updatedAt)}`,
          }))}
        />
        <RecentListCard
          title="Recent Inspections"
          href="/dashboard/inspections"
          emptyMessage="No inspections yet"
          items={recentInspections.map((inspection) => ({
            id: inspection.id,
            primary: inspection.vehicleLicensePlate ?? "Unknown vehicle",
            secondary: inspection.vehicleDisplayName ?? "Inspection",
            meta: `${formatStatus(inspection.status)} · ${formatDate(inspection.updatedAt)}`,
          }))}
        />
        <RecentListCard
          title="Recent Agreements"
          href="/dashboard/agreements"
          emptyMessage="No agreements yet"
          items={recentAgreements.map((agreement) => ({
            id: agreement.id,
            primary: agreement.licensePlate,
            secondary: agreement.templateTitle,
            meta: `${formatStatus(agreement.status)} · ${formatDate(agreement.updatedAt)}`,
          }))}
        />
      </div>

      {/* Management Center */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Management Center</h2>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
            Quick actions
          </span>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <ManagementCard
            title="Vehicle Groups"
            description="Manage vehicle groups and assignments"
            href="/dashboard/vehicles/groups"
            icon="🚗"
          />
          {user.roleName === "admin" && (
            <ManagementCard
              title="User Management"
              description="Manage users and roles"
              href="/dashboard/admin/users"
              icon="👤"
            />
          )}
          <ManagementCard
            title="All Vehicles"
            description="View and manage all vehicles"
            href="/dashboard/vehicles"
            icon="📋"
          />
        </div>
      </div>
    </div>
  );
}

interface RecentListCardItem {
  id: string;
  primary: string;
  secondary: string;
  meta: string;
}

function RecentListCard({
  title,
  href,
  emptyMessage,
  items,
}: {
  title: string;
  href: string;
  emptyMessage: string;
  items: RecentListCardItem[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          View All
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414L13.414 10l-4.707 4.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-100 bg-white/90 p-3">
              <p className="text-sm font-semibold text-gray-900">{item.primary}</p>
              <p className="text-sm text-gray-600">{item.secondary}</p>
              <p className="text-xs text-gray-400">{item.meta}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ManagementCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm transition hover:border-blue-500 hover:shadow-lg"
    >
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-lg">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
      <span className="mt-3 inline-flex items-center text-sm font-semibold text-blue-600">
        Open
        <svg viewBox="0 0 20 20" fill="currentColor" className="ml-1 h-4 w-4">
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414L13.414 10l-4.707 4.707a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    </Link>
  );
}
