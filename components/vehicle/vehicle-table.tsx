"use client";

import type { VehicleWithGroup } from "@/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface VehicleTableProps {
  vehicles: VehicleWithGroup[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export function VehicleTable({
  vehicles,
  total,
  currentPage,
  totalPages,
}: VehicleTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [ownership, setOwnership] = useState(
    searchParams.get("ownership") || "all"
  );

  const handleFilter = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status !== "all") params.set("status", status);
    if (ownership !== "all") params.set("ownership", ownership);
    params.set("page", "1");
    router.push(`/dashboard/vehicles?${params.toString()}`);
  };

  const handleReset = () => {
    setSearch("");
    setStatus("all");
    setOwnership("all");
    router.push("/dashboard/vehicles");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleFilter();
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return parsed.toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatStatus = (status: string) => {
    if (!status) return "—";
    return status
      .split("_")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-6 border-b border-gray-100">
        <form
          onSubmit={handleFilter}
          className="flex flex-col gap-4 md:flex-row md:items-center"
        >
          <div className="relative flex-1">
            <input
              type="search"
              placeholder="Search license plate, make, or model"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="maintenance">Under Maintenance</option>
            <option value="temporarily_assigned">Temporarily Assigned</option>
            <option value="leased_out">Leased Out</option>
            <option value="retired">Retired</option>
            <option value="sold">Sold</option>
          </select>
          <select
            value={ownership}
            onChange={(e) => setOwnership(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Ownership</option>
            <option value="owned">Owned</option>
            <option value="external">External (borrowed/leased)</option>
            <option value="leased_out">Leased Out</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                License Plate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Group
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No vehicles found. Try adjusting your search or filters.
                </td>
              </tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {vehicle.licensePlate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {vehicle.year} {vehicle.make}
                    </div>
                    <div className="text-sm text-gray-500">{vehicle.model}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                      {vehicle.groupName || "No Group"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                      {formatStatus(vehicle.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(vehicle.updatedAt.toString())}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/vehicles/${vehicle.id}`}
                        className="inline-flex items-center rounded-lg border border-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
                      >
                        View
                      </Link>
                      <Link
                        href={`/dashboard/vehicles/${vehicle.id}/edit`}
                        className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Edit
                      </Link>
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
          Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, total)} of {total} vehicles
        </span>
        {totalPages > 1 && (
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/dashboard/vehicles?${(() => {
                  const params = new URLSearchParams(
                    Object.fromEntries(searchParams)
                  );
                  params.set("page", (currentPage - 1).toString());
                  return params.toString();
                })()}`}
                className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/dashboard/vehicles?${(() => {
                  const params = new URLSearchParams(
                    Object.fromEntries(searchParams)
                  );
                  params.set("page", (currentPage + 1).toString());
                  return params.toString();
                })()}`}
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
