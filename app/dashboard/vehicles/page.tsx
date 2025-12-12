import { VehicleTable } from "@/components/vehicle/vehicle-table";
import { requireAuth } from "@/lib/auth-utils";
import { listVehicles } from "@/lib/services/vehicle.service";
import Link from "next/link";

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
          <p className="mt-2 text-gray-600">Manage your fleet of vehicles</p>
        </div>
        <Link
          href="/dashboard/vehicles/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Vehicle
        </Link>
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
