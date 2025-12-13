"use client";

import { Toast, type ToastType } from "@/components/ui/toast";
import { AddVehiclesModal } from "@/components/vehicle-group/add-vehicles-modal";
import { AssignManagersModal } from "@/components/vehicle-group/assign-managers-modal";
import { AssignVehicleButton } from "@/components/vehicle-group/assign-vehicle-button";
import { ReclaimVehiclesModal } from "@/components/vehicle-group/reclaim-vehicles-modal";
import { ReturnToDefaultButton } from "@/components/vehicle-group/return-to-default-button";
import type { VehicleGroupDetail } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useState } from "react";

const formatDate = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 last:border-b-0">
    <span className="text-sm text-gray-500">{label}</span>
    <div className="text-sm font-medium text-gray-900 text-right max-w-[60%] break-words">
      {typeof value === "string" ? value : value}
    </div>
  </div>
);

interface GroupDetailClientProps {
  group: VehicleGroupDetail;
  assignedManagerIds: string[];
  showDeleteButtonOnly?: boolean;
}

export function GroupDetailClient({
  group,
  assignedManagerIds,
  showDeleteButtonOnly = false,
}: GroupDetailClientProps) {
  const router = useRouter();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAddVehiclesModal, setShowAddVehiclesModal] = useState(false);
  const [showReclaimVehiclesModal, setShowReclaimVehiclesModal] =
    useState(false);
  const [deleting, setDeleting] = useState(false);
  const isDefaultGroup = group.name === "Default Group";
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(
    null
  );

  const showToast = (message: string, type: ToastType = "info") =>
    setToast({ message, type });

  const handleAssignSuccess = () => {
    router.refresh();
  };

  const handleDelete = async () => {
    if (isDefaultGroup) {
      showToast("The Default Group cannot be deleted.", "warning");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${group.name}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/vehicle-groups/${group.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        showToast(data.error || "Failed to delete group", "error");
        return;
      }

      router.push("/dashboard/vehicles/groups?success=deleted");
      router.refresh();
    } catch (error) {
      console.error(error);
      showToast("Failed to delete group", "error");
    } finally {
      setDeleting(false);
    }
  };

  // If only showing delete button (for header)
  if (showDeleteButtonOnly) {
    return (
      <button
        onClick={handleDelete}
        disabled={deleting || isDefaultGroup}
        className="px-4 py-2 bg-red-600 text-white rounded-r-md border border-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:z-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed -ml-px"
        title={
          isDefaultGroup ? "Default Group cannot be deleted" : "Delete group"
        }
      >
        {deleting
          ? "Deleting..."
          : isDefaultGroup
            ? "Protected"
            : "Delete Group"}
      </button>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
        {/* Vehicles in Group */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Vehicles in this Group
            </h2>
            {isDefaultGroup ? (
              <button
                onClick={() => setShowReclaimVehiclesModal(true)}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <svg
                  className="w-4 h-4 inline-block mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reclaim Vehicles
              </button>
            ) : (
              <button
                onClick={() => setShowAddVehiclesModal(true)}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <svg
                  className="w-4 h-4 inline-block mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Vehicles
              </button>
            )}
          </div>

          {group.vehicles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm">No vehicles in this group yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      License Plate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {group.vehicles.map((vehicle, index) => (
                    <tr
                      key={vehicle.id}
                      className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vehicle.licensePlate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            vehicle.status === "available"
                              ? "bg-green-100 text-green-800"
                              : vehicle.status === "assigned"
                                ? "bg-blue-100 text-blue-800"
                                : vehicle.status === "maintenance"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {vehicle.status.charAt(0).toUpperCase() +
                            vehicle.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/vehicles/${vehicle.id}`}
                            className="inline-flex items-center justify-center w-9 h-9 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                            title="View vehicle"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </Link>
                          {isDefaultGroup ? (
                            <AssignVehicleButton
                              vehicleId={vehicle.id}
                              vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                              currentGroupId={group.id}
                              onSuccess={handleAssignSuccess}
                            />
                          ) : (
                            <ReturnToDefaultButton
                              vehicleId={vehicle.id}
                              vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                              onSuccess={handleAssignSuccess}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assigned Users & Group Information */}
        <div className="space-y-6">
          {/* Assigned Users */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Assigned Users
              </h2>
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Assign User
              </button>
            </div>

            {group.assignedManagers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p className="text-sm">No users assigned to this group yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {group.assignedManagers.map((manager) => (
                  <div
                    key={manager.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                        {manager.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {manager.name}
                          </p>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              manager.role === "manager"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {manager.role.charAt(0).toUpperCase() +
                              manager.role.slice(1)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {manager.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Group Information
            </h2>
            <div className="space-y-3">
              <InfoRow label="Created" value={formatDate(group.createdAt)} />
              <InfoRow label="Updated" value={formatDate(group.updatedAt)} />
              <InfoRow
                label="Type"
                value={
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      group.name === "Default Group"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {group.name === "Default Group"
                      ? "Default Group"
                      : "Customer Group"}
                  </span>
                }
              />
              <InfoRow label="Contract ID" value={group.contractId || "—"} />
              <InfoRow
                label="Area Manager Contact"
                value={group.areaManagerContact || "—"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Assign Managers Modal */}
      <AssignManagersModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        groupId={group.id}
        groupName={group.name}
        assignedManagerIds={assignedManagerIds}
        onAssignSuccess={handleAssignSuccess}
      />

      {/* Add Vehicles Modal (for Customer Groups) */}
      {!isDefaultGroup && (
        <AddVehiclesModal
          isOpen={showAddVehiclesModal}
          onClose={() => setShowAddVehiclesModal(false)}
          groupId={group.id}
          groupName={group.name}
          onSuccess={handleAssignSuccess}
        />
      )}

      {/* Reclaim Vehicles Modal (for Default Group) */}
      {isDefaultGroup && (
        <ReclaimVehiclesModal
          isOpen={showReclaimVehiclesModal}
          onClose={() => setShowReclaimVehiclesModal(false)}
          groupId={group.id}
          groupName={group.name}
          onSuccess={handleAssignSuccess}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
