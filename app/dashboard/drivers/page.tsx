import { DriverTable } from "@/components/drivers/driver-table";
import { DriverSuccessBanner } from "@/components/drivers/success-banner";
import { requireAuth } from "@/lib/auth-utils";
import { listDrivers } from "@/lib/services/driver.service";
import Link from "next/link";
import { Suspense } from "react";

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;

  const { drivers, total } = await listDrivers({ search, limit: 100 });

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <DriverSuccessBanner />
      </Suspense>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
          <p className="mt-2 text-gray-600">
            Manage contact information and agreements for your drivers
          </p>
        </div>
        <Link
          href="/dashboard/drivers/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v14m7-7H5"
            />
          </svg>
          Add Driver
        </Link>
      </div>

      <DriverTable drivers={drivers} total={total} search={search} />
    </div>
  );
}
