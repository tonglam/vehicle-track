"use client";

import { Modal } from "@/components/ui/modal";
import type { VehicleWithGroup } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AddVehiclesModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  onSuccess: () => void;
}

export function AddVehiclesModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  onSuccess,
}: AddVehiclesModalProps) {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<VehicleWithGroup[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadAvailableVehicles();
      setSelectedVehicleIds([]);
      setError("");
    }
  }, [isOpen]);

  const loadAvailableVehicles = async () => {
    setLoading(true);
    try {
      // Fetch vehicles from Default Group
      const response = await fetch(
        `/api/vehicle-groups/default/available-vehicles`
      );
      if (!response.ok) throw new Error("Failed to load vehicles");
      const data = await response.json();
      setVehicles(data.vehicles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVehicle = (vehicleId: string) => {
    setSelectedVehicleIds((prev) =>
      prev.includes(vehicleId)
        ? prev.filter((id) => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleToggleAll = () => {
    if (selectedVehicleIds.length === vehicles.length) {
      setSelectedVehicleIds([]);
    } else {
      setSelectedVehicleIds(vehicles.map((v) => v.id));
    }
  };

  const handleAddVehicles = async () => {
    if (selectedVehicleIds.length === 0) {
      setError("Please select at least one vehicle");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await Promise.all(
        selectedVehicleIds.map((vehicleId) =>
          fetch(`/api/vehicle-groups/${groupId}/vehicles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vehicleId }),
          }).then((res) => {
            if (!res.ok) {
              throw new Error("Failed to add vehicle");
            }
            return res.json();
          })
        )
      );

      onSuccess();
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add vehicles");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Vehicles to ${groupName}`}
      size="lg"
      type="info"
      primaryAction={{
        label: "Add Selected Vehicles",
        onClick: handleAddVehicles,
        loading: saving,
      }}
      secondaryAction={{
        label: "Cancel",
        onClick: onClose,
      }}
    >
      <div className="mt-2">
        <p className="text-sm text-gray-700 mb-4">
          Select vehicles from Default Group to add:
        </p>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Add Mode:</strong> You can only add vehicles from the
                Default Group. To get vehicles from other groups, they must
                first be returned to Default Group.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              No vehicles available in Default Group.
            </p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={
                    vehicles.length > 0 &&
                    selectedVehicleIds.length === vehicles.length
                  }
                  onChange={handleToggleAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="col-span-5">Vehicle</div>
              <div className="col-span-3">License Plate</div>
              <div className="col-span-3">Current Group</div>
            </div>

            {/* Table Body */}
            <div className="max-h-96 overflow-y-auto">
              {vehicles.map((vehicle) => (
                <label
                  key={vehicle.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedVehicleIds.includes(vehicle.id)}
                      onChange={() => handleToggleVehicle(vehicle.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="col-span-5 text-sm text-gray-900">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </div>
                  <div className="col-span-3 text-sm text-gray-700">
                    {vehicle.licensePlate}
                  </div>
                  <div className="col-span-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {vehicle.groupName || "Default Group"}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {selectedVehicleIds.length > 0 && (
          <p className="mt-3 text-sm text-gray-600">
            {selectedVehicleIds.length} vehicle(s) selected
          </p>
        )}
      </div>
    </Modal>
  );
}
