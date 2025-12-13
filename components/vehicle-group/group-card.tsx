"use client";

import { Toast, type ToastType } from "@/components/ui/toast";
import type { VehicleGroupWithStats } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface GroupCardProps {
  group: VehicleGroupWithStats;
}

type ToastState = { message: string; type: ToastType };

export function GroupCard({ group }: GroupCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const isDefaultGroup = group.name === "Default Group";
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: ToastType = "info") =>
    setToast({ message, type });

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {group.name}
        </h3>
        {group.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {group.description}
          </p>
        )}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {group.totalVehicles}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total Vehicles</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {group.activeVehicles}
            </p>
            <p className="text-xs text-gray-500 mt-1">Active Vehicles</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 border-t border-gray-200">
        <Link
          href={`/dashboard/vehicles/groups/${group.id}`}
          className="flex items-center justify-center gap-2 px-4 py-3 text-blue-600 hover:bg-blue-50 transition-colors border-r border-gray-200"
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
          View
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting || isDefaultGroup}
          className="flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            isDefaultGroup ? "Default Group cannot be deleted" : "Delete group"
          }
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          {deleting ? "Deleting..." : isDefaultGroup ? "Protected" : "Delete"}
        </button>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
