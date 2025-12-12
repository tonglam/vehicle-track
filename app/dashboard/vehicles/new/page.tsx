import { VehicleForm } from "@/components/vehicle/vehicle-form";
import { requireRole } from "@/lib/auth-utils";

export default async function NewVehiclePage() {
  await requireRole(["admin", "manager"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Vehicle</h1>
        <p className="mt-2 text-gray-600">Create a new vehicle in the system</p>
      </div>

      <VehicleForm />
    </div>
  );
}
