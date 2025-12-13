"use client";

import type { InspectionListItem } from "@/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

interface InspectionTableProps {
  inspections: InspectionListItem[];
  total: number;
  currentPage: number;
  totalPages: number;
  initialSearch?: string;
  initialStatus?: string;
}

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Submitted", value: "submitted" },
];

function formatDate(date: Date | string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function InspectionTable({
  inspections,
  total,
  currentPage,
  totalPages,
  initialSearch = "",
  initialStatus = "all",
}: InspectionTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    if (status && status !== "all") {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    setSearch("");
    setStatus("all");
    router.push(pathname);
  };

  const paginationParams = useMemo(() => {
    return new URLSearchParams(searchParams.toString());
  }, [searchParams]);

  const buildPageHref = (page: number) => {
    const params = new URLSearchParams(paginationParams.toString());
    params.set("page", page.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handleDelete = async (inspectionId: string, vehicleLabel: string) => {
    const confirmed = window.confirm(
      `Delete inspection for ${vehicleLabel}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(inspectionId);
    try {
      const response = await fetch(`/api/inspections/${inspectionId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete inspection");
      }
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete inspection";
      window.alert(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 p-6">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 md:flex-row md:items-center"
        >
          <div className="relative flex-1">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by license plate"
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Search
            </button>
            {(initialSearch || initialStatus !== "all") && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Inspector
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Last Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inspections.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-gray-500"
                >
                  No inspections yet. Create one to get started.
                </td>
              </tr>
            ) : (
              inspections.map((inspection) => (
                <tr key={inspection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {inspection.vehicleDisplayName || "Unknown Vehicle"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {inspection.vehicleLicensePlate || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {inspection.inspectorName || "Unassigned"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        inspection.status === "submitted"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {formatStatus(inspection.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(inspection.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="inline-flex flex-wrap justify-end gap-2">
                      <a
                        href={`/dashboard/inspections/${inspection.id}`}
                        className="inline-flex items-center rounded-lg border border-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
                      >
                        View
                      </a>
                      {inspection.status === "draft" && (
                        <>
                          <a
                            href={`/dashboard/inspections/${inspection.id}/edit`}
                            className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                          >
                            Edit
                          </a>
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                inspection.id,
                                inspection.vehicleDisplayName ||
                                  inspection.vehicleLicensePlate ||
                                  "this vehicle"
                              )
                            }
                            disabled={deletingId === inspection.id}
                            className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"
                          >
                            {deletingId === inspection.id ? "Deleting..." : "Delete"}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
        <span>
          Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, total)} of {total} inspections
        </span>
        {totalPages > 1 && (
          <div className="flex gap-2">
            {currentPage > 1 && (
              <a
                href={buildPageHref(currentPage - 1)}
                className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
              >
                Previous
              </a>
            )}
            {currentPage < totalPages && (
              <a
                href={buildPageHref(currentPage + 1)}
                className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
              >
                Next
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
