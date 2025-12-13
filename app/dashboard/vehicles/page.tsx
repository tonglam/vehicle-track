import { SuccessBanner } from "@/components/vehicle/success-banner";
import { VehicleTable } from "@/components/vehicle/vehicle-table";
import { requireAuth } from "@/lib/auth-utils";
import { listVehicles } from "@/lib/services/vehicle.service";
import Link from "next/link";
import { Suspense } from "react";

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAuth();
  const params = await searchParams;

  const filters = {
    search: typeof params.search === "string" ? params.search : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    ownership:
      typeof params.ownership === "string" ? params.ownership : undefined,
    limit: 10,
    offset:
      typeof params.page === "string" ? (parseInt(params.page) - 1) * 10 : 0,
  };

  const { vehicles, total } = await listVehicles(filters);
  const currentPage =
    typeof params.page === "string" ? parseInt(params.page) : 1;
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <SuccessBanner />
      </Suspense>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
          <p className="mt-2 text-gray-600">Manage your fleet of vehicles</p>
        </div>
        <div className="inline-flex rounded-lg shadow-sm" role="group">
          <Link
            href="/dashboard/vehicles/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-l-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Vehicle
          </Link>
          <Link
            href="/dashboard/fleet/groups"
            className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-r-lg border border-l-0 border-gray-300 hover:bg-gray-50 transition-colors font-medium"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            Manage Groups
          </Link>
        </div>
      </div>

      <VehicleTable
        vehicles={vehicles}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}
