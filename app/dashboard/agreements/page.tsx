import { AgreementTable } from "@/components/agreements/agreement-table";
import { requireAuth } from "@/lib/auth-utils";
import { listAgreements } from "@/lib/services/agreement.service";
import type { Agreement } from "@/types";
import Link from "next/link";

const PAGE_SIZE = 10;

const AGREEMENT_STATUSES: Agreement["status"][] = [
  "draft",
  "pending_signature",
  "signed",
  "terminated",
];

function isAgreementStatus(
  value: string | undefined
): value is Agreement["status"] {
  return !!value && AGREEMENT_STATUSES.includes(value as Agreement["status"]);
}

export default async function AgreementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAuth();
  const params = await searchParams;

  const rawPage =
    typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const currentPage = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const search = typeof params.search === "string" ? params.search : undefined;
  const statusParam =
    typeof params.status === "string" ? params.status : undefined;
  const statusFilter = isAgreementStatus(statusParam) ? statusParam : undefined;

  const { agreements, total } = await listAgreements({
    status: statusFilter,
    search,
    limit: PAGE_SIZE,
    offset: (currentPage - 1) * PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agreements</h1>
          <p className="mt-2 text-gray-600">
            Track agreement progress, signatures, and template usage across your
            fleet
          </p>
        </div>
        <div className="inline-flex rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <Link
            href="/dashboard/agreements/new"
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
            New Agreement
          </Link>
          <Link
            href="/dashboard/agreements/templates"
            className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-50 border-l border-gray-200"
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
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            Manage Templates
          </Link>
        </div>
      </div>

      <AgreementTable
        agreements={agreements}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        initialStatus={statusFilter ?? "all"}
      />
    </div>
  );
}
