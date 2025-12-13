import { InspectionForm } from "@/components/inspections/inspection-form";
import { requireRole } from "@/lib/auth-utils";
import { getInspectionById } from "@/lib/services/inspection.service";
import { listVehicleOptions } from "@/lib/services/vehicle.service";
import { notFound } from "next/navigation";

export default async function EditInspectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin", "manager"]);
  const { id } = await params;

  const [inspection, vehicles] = await Promise.all([
    getInspectionById(id),
    listVehicleOptions(100),
  ]);

  if (!inspection) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Inspection
        </p>
        <h1 className="text-3xl font-bold text-gray-900">
          Edit {inspection.vehicleDisplayName}
        </h1>
        <p className="mt-2 text-gray-600">
          Update the recorded vehicle conditions and attach any supporting images.
        </p>
      </div>

      <InspectionForm vehicles={vehicles} inspection={inspection} />
    </div>
  );
}
