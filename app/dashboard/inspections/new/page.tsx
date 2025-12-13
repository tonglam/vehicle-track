import { InspectionForm } from "@/components/inspections/inspection-form";
import { requireRole } from "@/lib/auth-utils";
import { listVehicleOptions } from "@/lib/services/vehicle.service";

export default async function NewInspectionPage() {
  await requireRole(["admin", "manager"]);
  const vehicles = await listVehicleOptions(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Inspection</h1>
        <p className="mt-2 text-gray-600">
          Record vehicle handover conditions and capture key notes.
        </p>
      </div>

      <InspectionForm vehicles={vehicles} />
    </div>
  );
}
