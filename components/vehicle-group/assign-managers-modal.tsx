"use client";

import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import type { ToastPayload } from "@/components/ui/toast-storage";
import { useEffect, useState } from "react";

interface Manager {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedGroups: Array<{ id: string; name: string }>;
}

interface AssignManagersModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  assignedManagerIds: string[];
  onAssignSuccess: () => void;
}

export function AssignManagersModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  assignedManagerIds,
  onAssignSuccess,
}: AssignManagersModalProps) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadManagers();
      setSelectedManagerIds([]);
      setError("");
    }
  }, [isOpen]);

  const loadManagers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/vehicle-groups/${groupId}/managers`);
      if (!response.ok) throw new Error("Failed to load managers");
      const data = await response.json();
      setManagers(data.managers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load managers");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleManager = (managerId: string) => {
    setSelectedManagerIds((prev) =>
      prev.includes(managerId)
        ? prev.filter((id) => id !== managerId)
        : [...prev, managerId]
    );
  };

  const handleAssign = async () => {
    if (selectedManagerIds.length === 0) {
      setError("Please select at least one user to assign");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Assign each selected user
      const results = await Promise.allSettled(
        selectedManagerIds.map((managerId) =>
          fetch(`/api/vehicle-groups/${groupId}/managers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ managerId }),
          }).then(async (res) => {
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || "Failed to assign user");
            }
            return res.json();
          })
        )
      );

      // Check for any failures
      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length > 0) {
        const failedReasons = failures
          .map((f) => (f as PromiseRejectedResult).reason.message)
          .join(", ");
        throw new Error(`Some assignments failed: ${failedReasons}`);
      }

      onAssignSuccess();
      onClose();
      setToast({
        message: `Assigned ${selectedManagerIds.length} user${selectedManagerIds.length === 1 ? "" : "s"} to ${groupName}`,
        type: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to assign users";
      setError(message);
      setToast({ message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Filter out already assigned managers
  const availableManagers = managers.filter(
    (m) => !assignedManagerIds.includes(m.id)
  );

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
        title={`Assign Users to ${groupName}`}
        type="info"
        primaryAction={{
          label:
            selectedManagerIds.length > 0
              ? `Assign ${selectedManagerIds.length} User${selectedManagerIds.length !== 1 ? "s" : ""}`
              : "Assign Selected",
          onClick: handleAssign,
          loading: saving,
          disabled: selectedManagerIds.length === 0,
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: onClose,
        }}
      >
      <div className="mt-2">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-2">Loading users...</p>
          </div>
        ) : availableManagers.length === 0 ? (
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-gray-500 text-sm">
              No available users to assign. All users are already assigned to
              this group.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-3">
              Select users (managers/inspectors) to assign to this group:
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableManagers.map((manager) => (
                <label
                  key={manager.id}
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedManagerIds.includes(manager.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedManagerIds.includes(manager.id)}
                    onChange={() => handleToggleManager(manager.id)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {manager.name}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          manager.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : manager.role === "manager"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {manager.role.charAt(0).toUpperCase() +
                          manager.role.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {manager.email}
                    </p>
                    {manager.assignedGroups.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-gray-500">
                          Currently in:
                        </span>
                        {manager.assignedGroups.map((group) => (
                          <span
                            key={group.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700"
                          >
                            {group.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">
                        Not assigned to any groups
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
            {selectedManagerIds.length > 0 && (
              <p className="mt-3 text-sm text-blue-600 font-medium">
                {selectedManagerIds.length} user
                {selectedManagerIds.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </>
        )}

        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </Modal>
    </>
  );
}
