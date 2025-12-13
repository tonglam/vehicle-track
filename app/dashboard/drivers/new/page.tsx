import { DriverForm } from "@/components/drivers/driver-form";
import { requireRole } from "@/lib/auth-utils";

export default async function NewDriverPage() {
  await requireRole(["admin", "manager"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Driver</h1>
        <p className="mt-2 text-gray-600">
          Maintain driver contact details for agreement workflows.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <DriverForm mode="create" />
      </div>
    </div>
  );
}
