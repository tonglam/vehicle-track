"use client";

import { Toast, type ToastType } from "@/components/ui/toast";
import type { DriverListItem } from "@/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface DriverTableProps {
  drivers: DriverListItem[];
  total: number;
  search?: string;
}

export function DriverTable({ drivers, total, search }: DriverTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [term, setTerm] = useState(search || "");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(
    null
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (term.trim()) {
      params.set("search", term.trim());
    } else {
      params.delete("search");
    }
    router.push(
      params.toString() ? `${pathname}?${params.toString()}` : pathname
    );
  };

  const handleClear = () => {
    setTerm("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    router.push(
      params.toString() ? `${pathname}?${params.toString()}` : pathname
    );
  };

  const handleDelete = async (driverId: string, driverName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${driverName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(driverId);
    try {
      const response = await fetch(`/api/drivers/${driverId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setToast({
          message: data.error || "Failed to delete driver",
          type: "error",
        });
        return;
      }

      router.push("/dashboard/drivers?status=deleted");
      router.refresh();
    } catch (error) {
      console.error(error);
      setToast({
        message: "Failed to delete driver. Please try again.",
        type: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 md:flex-row md:items-center"
        >
          <div className="flex-1">
            <label htmlFor="driver-search" className="sr-only">
              Search drivers
            </label>
            <div className="relative">
              <input
                id="driver-search"
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search name, email, or phone"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {drivers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No drivers found. Try adjusting your search.
                </td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {driver.firstName} {driver.lastName}
                    </div>
                    <div className="text-xs text-gray-500">Driver</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {driver.email || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {driver.phone || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(driver.createdAt).toLocaleDateString("en-AU", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/drivers/${driver.id}`)
                        }
                        className="inline-flex items-center rounded-lg border border-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
                      >
                        View
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(
                            driver.id,
                            `${driver.firstName} ${driver.lastName}`
                          )
                        }
                        disabled={deletingId === driver.id}
                        className="inline-flex items-center rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === driver.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-gray-100 text-sm text-gray-600">
        Showing {drivers.length} of {total} driver{total === 1 ? "" : "s"}
      </div>
    </div>
  );
}
