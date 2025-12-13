import { InspectionTable } from "@/components/inspections/inspection-table";
import { requireAuth } from "@/lib/auth-utils";
import { listInspections } from "@/lib/services/inspection.service";
import Link from "next/link";

const PAGE_SIZE = 10;

export default async function InspectionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAuth();
  const params = await searchParams;

  const search = typeof params.search === "string" ? params.search : undefined;
  const statusParam = typeof params.status === "string" ? params.status : undefined;
  const normalizedStatus = statusParam && ["draft", "submitted"].includes(statusParam.toLowerCase())
    ? statusParam.toLowerCase()
    : undefined;
  const pageParam = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const currentPage = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const { inspections, total } = await listInspections({
    search,
    status: normalizedStatus,
    limit: PAGE_SIZE,
    offset: (currentPage - 1) * PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inspections</h1>
          <p className="mt-2 text-gray-600">
            Track vehicle inspections, review condition notes, and manage drafts.
          </p>
        </div>
        <div className="inline-flex rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <Link
            href="/dashboard/inspections/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v14m7-7H5"
              />
            </svg>
            New Inspection
          </Link>
        </div>
      </div>

      <InspectionTable
        inspections={inspections}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        initialSearch={search}
        initialStatus={normalizedStatus ?? "all"}
      />
    </div>
  );
}
