"use client";

import type { Agreement, AgreementListItem } from "@/types";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface AgreementTableProps {
  agreements: AgreementListItem[];
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  initialStatus?: Agreement["status"] | "all";
}

const STATUS_OPTIONS: Array<{ label: string; value: Agreement["status"] | "all" }> = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Pending Signature", value: "pending_signature" },
  { label: "Signed", value: "signed" },
  { label: "Terminated", value: "terminated" },
];

const STATUS_STYLES: Record<Agreement["status"], string> = {
  draft: "bg-gray-100 text-gray-800",
  pending_signature: "bg-yellow-100 text-yellow-800",
  signed: "bg-green-100 text-green-800",
  terminated: "bg-red-100 text-red-800",
};

function formatStatusLabel(status: string) {
  return status
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatDateValue(date: Date | string | null) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AgreementTable({
  agreements,
  total,
  currentPage,
  totalPages,
  pageSize,
  initialStatus = "all",
}: AgreementTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const activeStatus = initialStatus ?? "all";

  const updateRoute = (params: URLSearchParams) => {
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const handleStatusChange = (value: Agreement["status"] | "all") => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    params.delete("page");
    updateRoute(params);
  };

  const pageDescription = (() => {
    if (total === 0) return "Showing 0 agreements";
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);
    return `Showing ${start} to ${end} of ${total} agreements`;
  })();

  const buildPageHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleStatusChange(option.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border ${
                activeStatus === option.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Agreement
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Last Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Signed By
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {agreements.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-sm text-gray-500"
                >
                  No agreements found. Try adjusting your filters.
                </td>
              </tr>
            ) : (
              agreements.map((agreement) => (
                <tr key={agreement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {agreement.licensePlate}
                    </div>
                    <div className="text-xs text-gray-500">
                      {agreement.vehicleDisplayName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {agreement.templateTitle}
                    </div>
                    <div className="text-xs text-gray-500">
                      {agreement.signedAt
                        ? `Signed ${formatDateValue(agreement.signedAt)}`
                        : "Awaiting signature"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[agreement.status]}`}
                    >
                      {formatStatusLabel(agreement.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateValue(agreement.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateValue(agreement.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {agreement.signedBy ? (
                      <div>
                        <div className="font-medium">{agreement.signedBy}</div>
                        <div className="text-xs text-gray-500">
                          {agreement.signedAt
                            ? formatDateValue(agreement.signedAt)
                            : "Pending"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/dashboard/agreements/${agreement.id}`}
                      className="inline-flex items-center rounded-lg border border-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
        <span>{pageDescription}</span>
        {totalPages > 1 && (
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={buildPageHref(currentPage - 1)}
                className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={buildPageHref(currentPage + 1)}
                className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
