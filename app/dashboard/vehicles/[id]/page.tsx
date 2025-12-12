import { requireAuth } from "@/lib/auth-utils";
import { getVehicleById } from "@/lib/services/vehicle.service";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const vehicle = await getVehicleById(id);

  if (!vehicle) {
    notFound();
  }

  const formatDate = (date: string | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <p className="mt-2 text-gray-600">{vehicle.licensePlate}</p>
        </div>
        <Link
          href={`/dashboard/vehicles/${id}/edit`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Edit Vehicle
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicle Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Vehicle Information
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                License Plate
              </dt>
              <dd className="text-sm text-gray-900">{vehicle.licensePlate}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Make</dt>
              <dd className="text-sm text-gray-900">{vehicle.make}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Model</dt>
              <dd className="text-sm text-gray-900">{vehicle.model}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Year</dt>
              <dd className="text-sm text-gray-900">{vehicle.year}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">VIN</dt>
              <dd className="text-sm text-gray-900">{vehicle.vin}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    vehicle.status === "available"
                      ? "bg-green-100 text-green-800"
                      : vehicle.status === "assigned"
                        ? "bg-blue-100 text-blue-800"
                        : vehicle.status === "maintenance"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {vehicle.status.replace("_", " ")}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Ownership</dt>
              <dd className="text-sm text-gray-900 capitalize">
                {vehicle.ownership.replace("_", " ")}
              </dd>
            </div>
            {vehicle.ownerCompany && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Owner Company
                </dt>
                <dd className="text-sm text-gray-900">
                  {vehicle.ownerCompany}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Technical Specifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Technical Specifications
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Fuel Type</dt>
              <dd className="text-sm text-gray-900 capitalize">
                {vehicle.fuelType}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Transmission
              </dt>
              <dd className="text-sm text-gray-900 capitalize">
                {vehicle.transmission.replace("_", " ")}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Engine Size</dt>
              <dd className="text-sm text-gray-900">
                {vehicle.engineSizeL
                  ? `${vehicle.engineSizeL}L`
                  : "Not specified"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Odometer</dt>
              <dd className="text-sm text-gray-900">
                {vehicle.odometer ? `${vehicle.odometer} km` : "Not specified"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Service Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Service Information
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Purchase Date
              </dt>
              <dd className="text-sm text-gray-900">
                {formatDate(vehicle.purchaseDate)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Last Service
              </dt>
              <dd className="text-sm text-gray-900">
                {formatDate(vehicle.lastServiceDate)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Next Service Due
              </dt>
              <dd className="text-sm text-gray-900">
                {formatDate(vehicle.nextServiceDue)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Attachments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Attachments
          </h2>
          <p className="text-sm text-gray-500">No attachments uploaded.</p>
        </div>

        {/* Notes */}
        {vehicle.notes && (
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {vehicle.notes}
            </p>
          </div>
        )}

        {/* Lease Out History */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Lease Out History
            </h2>
          </div>
          <p className="text-sm text-gray-500">No lease history available.</p>
        </div>

        {/* Inspection History */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Inspection History
            </h2>
          </div>
          <p className="text-sm text-gray-500">No inspections recorded.</p>
        </div>

        {/* Related Agreements */}
        <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Related Agreements
            </h2>
          </div>
          <p className="text-sm text-gray-500">No related agreements.</p>
        </div>
      </div>
    </div>
  );
}
