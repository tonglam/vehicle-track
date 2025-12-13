"use client";

import { Toast, type ToastType } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ReturnToDefaultButtonProps {
  vehicleId: string;
  vehicleName: string;
  onSuccess?: () => void;
}

export function ReturnToDefaultButton({
  vehicleId,
  vehicleName,
  onSuccess,
}: ReturnToDefaultButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(
    null
  );

  const handleReturn = async () => {
    if (
      !confirm(
        `Return "${vehicleName}" to Default Group?\n\nThis vehicle will be moved back to the Default Group and can be reassigned to other groups.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      // First, get the Default Group ID
      const groupsResponse = await fetch("/api/vehicle-groups");
      if (!groupsResponse.ok) throw new Error("Failed to fetch groups");
      const groupsData = await groupsResponse.json();

      const defaultGroup = groupsData.groups.find(
        (g: { name: string; id: string }) => g.name === "Default Group"
      );

      if (!defaultGroup) {
        throw new Error("Default Group not found");
      }

      // Assign vehicle to Default Group
      const response = await fetch(
        `/api/vehicle-groups/${defaultGroup.id}/vehicles`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vehicleId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to return vehicle to Default Group");
      }

      router.refresh();
      onSuccess?.();
    } catch (error) {
      console.error(error);
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Failed to return vehicle to Default Group",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleReturn}
        disabled={loading}
        className="inline-flex items-center gap-1 px-3 py-1.5 border border-orange-300 text-orange-700 rounded-md hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Return to Default Group"
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
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
          />
        </svg>
        {loading ? "Returning..." : "Return to Default"}
      </button>
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
