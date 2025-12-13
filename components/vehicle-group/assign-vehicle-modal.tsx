"use client";

import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import type { ToastPayload } from "@/components/ui/toast-storage";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface VehicleGroup {
  id: string;
  name: string;
  description: string | null;
  totalVehicles: number;
  activeVehicles: number;
}

interface AssignVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName: string;
  currentGroupId: string;
  onSuccess?: () => void;
}

export function AssignVehicleModal({
  isOpen,
  onClose,
  vehicleId,
  vehicleName,
  currentGroupId,
  onSuccess,
}: AssignVehicleModalProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<VehicleGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<VehicleGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadGroups();
      setSearchQuery("");
      setSelectedGroupId(null);
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    // Filter groups based on search query
    if (searchQuery.trim() === "") {
      setFilteredGroups(groups);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = groups.filter(
        (group) =>
          group.name.toLowerCase().includes(query) ||
          group.description?.toLowerCase().includes(query)
      );
      setFilteredGroups(filtered);
    }
  }, [searchQuery, groups]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/vehicle-groups?excludeDefault=false");
      if (!response.ok) throw new Error("Failed to load groups");
      const data = await response.json();

      // Filter out the current group
      const availableGroups = data.groups.filter(
        (g: VehicleGroup) => g.id !== currentGroupId
      );
      setGroups(availableGroups);
      setFilteredGroups(availableGroups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedGroupId) {
      setError("Please select a group");
      return;
    }

    setAssigning(true);
    setError("");

    try {
      const response = await fetch(
        `/api/vehicle-groups/${selectedGroupId}/vehicles`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vehicleId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to assign vehicle");
      }

      onClose();
      router.refresh();
      onSuccess?.();
      setToast({
        message: `${vehicleName} assigned successfully`,
        type: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to assign vehicle";
      setError(message);
      setToast({ message, type: "error" });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Assign Vehicle to Group`}
        size="lg"
        type="info"
        primaryAction={{
          label: "Assign to Selected Group",
          onClick: handleAssign,
          loading: assigning,
          disabled: !selectedGroupId,
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: onClose,
        }}
      >
      <div className="mt-2">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Vehicle:</span> {vehicleName}
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <label
            htmlFor="group-search"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Search Groups
          </label>
          <div className="relative">
            <input
              id="group-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or description..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-2">Loading groups...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-8">
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
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-gray-500 text-sm">
              {searchQuery
                ? `No groups found matching "${searchQuery}"`
                : "No other groups available"}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-2 text-sm text-gray-600">
              {filteredGroups.length} group
              {filteredGroups.length !== 1 ? "s" : ""} available
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              {filteredGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                    selectedGroupId === group.id
                      ? "bg-blue-100 border-l-4 border-l-blue-600"
                      : "border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {group.name}
                        </h4>
                        {group.name === "Default Group" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            Default
                          </span>
                        )}
                      </div>
                      {group.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {group.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
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
                          {group.totalVehicles} vehicle
                          {group.totalVehicles !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {group.activeVehicles} active
                        </span>
                      </div>
                    </div>
                    {selectedGroupId === group.id && (
                      <div className="ml-3 flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </Modal>
    </>
  );
}
