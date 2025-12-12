import { VehicleForm } from "@/components/vehicle/vehicle-form";
import { requireRole } from "@/lib/auth-utils";
import { getVehicleById } from "@/lib/services/vehicle.service";
import { notFound } from "next/navigation";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin", "manager"]);
  const { id } = await params;
  const vehicle = await getVehicleById(id);

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Vehicle</h1>
        <p className="mt-2 text-gray-600">
          {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.licensePlate}
        </p>
      </div>

      <VehicleForm vehicle={vehicle} isEdit={true} />
    </div>
  );
}
