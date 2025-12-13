import { DriverSuccessBanner } from "@/components/drivers/success-banner";
import { requireAuth } from "@/lib/auth-utils";
import { getDriverDetail } from "@/lib/services/driver.service";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

function formatDate(value: Date | null) {
  if (!value) return "—";
  return value.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function DriverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const driver = await getDriverDetail(id);

  if (!driver) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <DriverSuccessBanner />
      </Suspense>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link
            href="/dashboard/drivers"
            className="mb-3 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <svg
              className="mr-1 h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Drivers
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {driver.firstName} {driver.lastName}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Added on {formatDate(driver.createdAt)}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/drivers/${driver.id}/edit`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Edit Driver
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Contact Information
            </h2>
            <dl className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <dt className="text-gray-500">Full Name</dt>
                <dd className="font-medium text-gray-900">
                  {driver.firstName} {driver.lastName}
                </dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900">
                  {driver.email ? (
                    <a
                      href={`mailto:${driver.email}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {driver.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-gray-500">Phone</dt>
                <dd className="font-medium text-gray-900">
                  {driver.phone || "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-gray-500">Notes</dt>
                <dd className="font-medium text-gray-900 whitespace-pre-line">
                  {driver.notes || "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Agreements
              </h2>
              <span className="text-sm text-gray-500">
                {driver.agreements.length} total
              </span>
            </div>
            {driver.agreements.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                No agreements associated with this driver yet.
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                          Template
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                          Signed
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                          Original Vehicle
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                          Current Vehicle
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {driver.agreements.map((agreement) => (
                        <tr key={agreement.id}>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {agreement.templateTitle}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                              {agreement.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {agreement.signedAt
                              ? formatDate(agreement.signedAt)
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {agreement.vehicleName} ({agreement.licensePlate})
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {agreement.vehicleName} ({agreement.licensePlate})
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/dashboard/agreements/${agreement.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Agreement Statistics
            </h2>
            <dl className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <dt className="text-gray-500">Total Agreements</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {driver.stats.totalAgreements}
                </dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-gray-500">Active Agreements</dt>
                <dd className="text-lg font-semibold text-green-600">
                  {driver.stats.activeAgreements}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
