import { AgreementCreationForm } from "@/components/agreements/agreement-creation-form";
import { requireRole } from "@/lib/auth-utils";
import { listAgreementTemplatesSummary } from "@/lib/services/agreement.service";
import { listVehicleOptions } from "@/lib/services/vehicle.service";

export default async function NewAgreementPage() {
  await requireRole(["admin", "manager"]);

  const [vehicles, templates] = await Promise.all([
    listVehicleOptions(50),
    listAgreementTemplatesSummary(),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Create Agreement</h1>
        <p className="text-gray-600">
          Build a new agreement by linking a vehicle inspection to a template
          for signatures.
        </p>
      </div>

      <AgreementCreationForm vehicles={vehicles} templates={templates} />
    </div>
  );
}
