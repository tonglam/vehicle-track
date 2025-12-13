"use client";

import { useState } from "react";
import { AssignVehicleModal } from "./assign-vehicle-modal";

interface AssignVehicleButtonProps {
  vehicleId: string;
  vehicleName: string;
  currentGroupId: string;
  onSuccess?: () => void;
}

export function AssignVehicleButton({
  vehicleId,
  vehicleName,
  currentGroupId,
  onSuccess,
}: AssignVehicleButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        title="Assign to another group"
      >
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
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
        Assign
      </button>

      <AssignVehicleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        vehicleId={vehicleId}
        vehicleName={vehicleName}
        currentGroupId={currentGroupId}
        onSuccess={onSuccess}
      />
    </>
  );
}
