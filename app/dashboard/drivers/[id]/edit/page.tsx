import { DriverForm } from "@/components/drivers/driver-form";
import { requireRole } from "@/lib/auth-utils";
import { getDriverDetail } from "@/lib/services/driver.service";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditDriverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin", "manager"]);
  const { id } = await params;
  const driver = await getDriverDetail(id);

  if (!driver) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Driver</h1>
          <p className="mt-2 text-gray-600">
            Update contact details and notes for this driver
          </p>
        </div>
        <Link
          href={`/dashboard/drivers/${driver.id}`}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          View driver
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <DriverForm mode="edit" driver={driver} />
      </div>
    </div>
  );
}
