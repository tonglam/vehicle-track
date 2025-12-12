"use client";

import type { Vehicle } from "@/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface VehicleTableProps {
  vehicles: Vehicle[];
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

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
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

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-6 border-b">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by license plate, make, or model"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Ownership</option>
            <option value="owned">Owned</option>
            <option value="external">External (borrowed/leased)</option>
            <option value="leased_out">Leased Out</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleFilter}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
            <button
              onClick={handleReset}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                License Plate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Make & Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Updated At
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
                  No vehicles found.{" "}
                  <Link
                    href="/dashboard/vehicles/new"
                    className="text-blue-600 hover:underline"
                  >
                    Add your first vehicle
                  </Link>
                </td>
              </tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {vehicle.licensePlate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vehicle.make} {vehicle.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vehicle.year}
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
                      {vehicle.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(vehicle.updatedAt.toString())}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <Link
                      href={`/dashboard/vehicles/${vehicle.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                    <Link
                      href={`/dashboard/vehicles/${vehicle.id}/edit`}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * 10 + 1} to{" "}
            {Math.min(currentPage * 10, total)} of {total} vehicles
          </div>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/dashboard/vehicles?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: (currentPage - 1).toString() }).toString()}`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/dashboard/vehicles?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: (currentPage + 1).toString() }).toString()}`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
