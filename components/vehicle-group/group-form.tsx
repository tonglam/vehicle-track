"use client";

import type { VehicleGroup, VehicleGroupDetail } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface GroupFormProps {
  group?: VehicleGroup | VehicleGroupDetail;
  isEdit?: boolean;
}

export function GroupForm({ group, isEdit = false }: GroupFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: group?.name || "",
    description: group?.description || "",
    contractId: group?.contractId || "",
    areaManagerContact: group?.areaManagerContact || "",
    signatureMode: group?.signatureMode || "dual",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignatureModeChange = (value: "dual" | "supervisor_only") => {
    setFormData((prev) => ({
      ...prev,
      signatureMode: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEdit
        ? `/api/vehicle-groups/${group?.id}`
        : "/api/vehicle-groups";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save group");
      }

      const result = await response.json();

      // Redirect immediately with success message
      if (isEdit) {
        router.push(`/dashboard/vehicles/groups/${result.id}?success=updated`);
      } else {
        router.push(`/dashboard/vehicles/groups?success=created`);
      }
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save group";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Card Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-0">
            {isEdit ? `Edit Group: ${group?.name}` : "Create New Group"}
          </h4>
        </div>

        {/* Card Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Group Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter group name"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description of this group"
                />
              </div>

              {/* Contract ID */}
              <div>
                <label
                  htmlFor="contractId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Contract ID
                </label>
                <input
                  type="text"
                  id="contractId"
                  name="contractId"
                  value={formData.contractId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 949"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Displayed on contractor vehicle checklists for this group.
                </p>
              </div>

              {/* Area Manager Contact */}
              <div>
                <label
                  htmlFor="areaManagerContact"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Area Manager Contact
                </label>
                <input
                  type="text"
                  id="areaManagerContact"
                  name="areaManagerContact"
                  value={formData.areaManagerContact}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Antonio Shanmuganathan"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Used in the checklist/PDF fault reporting section.
                </p>
              </div>

              {/* Contractor Checklist Signatures */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contractor checklist signatures
                </label>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <input
                      type="radio"
                      id="signatureModeDual"
                      name="signatureMode"
                      value="dual"
                      checked={formData.signatureMode === "dual"}
                      onChange={() => handleSignatureModeChange("dual")}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="signatureModeDual"
                      className="ml-3 text-sm text-gray-700 cursor-pointer"
                    >
                      Driver + Principal/Supervisor signatures required
                    </label>
                  </div>
                  <div className="flex items-start">
                    <input
                      type="radio"
                      id="signatureModeSupervisor"
                      name="signatureMode"
                      value="supervisor_only"
                      checked={formData.signatureMode === "supervisor_only"}
                      onChange={() =>
                        handleSignatureModeChange("supervisor_only")
                      }
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="signatureModeSupervisor"
                      className="ml-3 text-sm text-gray-700 cursor-pointer"
                    >
                      Principal/Supervisor signature only
                    </label>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  This controls which signature panels appear on contractor
                  vehicle checklists for vehicles in this group.
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => router.push("/dashboard/vehicles/groups")}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Groups
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {loading
                  ? "Saving..."
                  : isEdit
                    ? "Update Group"
                    : "Create Group"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
