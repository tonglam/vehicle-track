"use client";

import type {
  AgreementTemplateSummary,
  InspectionListItem,
  VehicleOption,
} from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AgreementCreationFormProps {
  vehicles: VehicleOption[];
  templates: AgreementTemplateSummary[];
}

interface LoadState {
  loading: boolean;
  error: string | null;
}

function formatVehicleLabel(vehicle: VehicleOption) {
  const nameParts = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean);
  const base = nameParts.join(" ").trim();
  return base.length > 0 ? base : "Unnamed Vehicle";
}

function formatDate(date: Date | string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }
  return parsed.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date: Date | string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AgreementCreationForm({
  vehicles,
  templates,
}: AgreementCreationFormProps) {
  const router = useRouter();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [inspections, setInspections] = useState<InspectionListItem[]>([]);
  const [{ loading, error }, setLoadState] = useState<LoadState>({
    loading: false,
    error: null,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedVehicleId) {
      setInspections([]);
      setSelectedInspectionId("");
      setLoadState({ loading: false, error: null });
      return;
    }

    const controller = new AbortController();
    setLoadState({ loading: true, error: null });
    setSelectedInspectionId("");

    fetch(
      `/api/inspections?vehicleId=${selectedVehicleId}&limit=10`,
      {
        signal: controller.signal,
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load inspections");
        }
        return response.json();
      })
      .then((data: { inspections: InspectionListItem[] }) => {
        setInspections(data.inspections);
        setLoadState({ loading: false, error: null });
      })
      .catch((err) => {
        if (controller.signal.aborted) {
          return;
        }
        setLoadState({
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load inspections",
        });
      });

    return () => controller.abort();
  }, [selectedVehicleId]);

  const handleSubmit = async () => {
    if (!selectedVehicleId || !selectedInspectionId || !selectedTemplateId) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/agreements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleId: selectedVehicleId,
          inspectionId: selectedInspectionId,
          templateId: selectedTemplateId,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create agreement");
      }

      router.push("/dashboard/agreements?status=created");
      router.refresh();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create agreement"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);
  const selectedInspection = inspections.find(
    (inspection) => inspection.id === selectedInspectionId
  );
  const selectedTemplate = templates.find(
    (template) => template.id === selectedTemplateId
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <div className="space-y-6">
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Step 1
              </p>
              <h2 className="text-lg font-semibold text-gray-900">
                Select Vehicle
              </h2>
              <p className="text-sm text-gray-600">
                Choose the vehicle the agreement should be linked to
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-600">Required</span>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700" htmlFor="vehicle-select">
              Vehicle
            </label>
            <select
              id="vehicle-select"
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedVehicleId}
              onChange={(event) => setSelectedVehicleId(event.target.value)}
            >
              <option value="">Select a vehicle...</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {formatVehicleLabel(vehicle)} ({vehicle.licensePlate})
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">
              Showing the {vehicles.length} most recently updated vehicles.
            </p>
          </div>
        </section>

        <section
          className={`bg-white border border-gray-200 rounded-xl p-6 ${
            !selectedVehicleId ? "opacity-60" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Step 2
              </p>
              <h2 className="text-lg font-semibold text-gray-900">
                Select Inspection
              </h2>
              <p className="text-sm text-gray-600">
                Choose the inspection that captures the vehicle condition
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-600">Required</span>
          </div>

          {!selectedVehicleId ? (
            <p className="mt-4 text-sm text-gray-500">
              Select a vehicle to load related inspections.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {loading && (
                <p className="text-sm text-gray-500">Loading inspections...</p>
              )}
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              {!loading && !error && inspections.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
                  <p className="text-sm text-gray-600">
                    No inspections found for this vehicle.
                  </p>
                  <Link
                    href={`/dashboard/inspections/new${selectedVehicleId ? `?vehicleId=${selectedVehicleId}` : ""}`}
                    className="mt-3 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Create Inspection
                  </Link>
                </div>
              )}

              {!loading && !error && inspections.length > 0 && (
                <div className="space-y-3">
                  {inspections.map((inspection) => (
                    <label
                      key={inspection.id}
                      className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                        selectedInspectionId === inspection.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatDate(inspection.updatedAt)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(inspection.updatedAt)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            inspection.status === "submitted"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {inspection.status === "submitted" ? "Submitted" : "Draft"}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                        <span>
                          Inspector: {inspection.inspectorName || "Unassigned"}
                        </span>
                        {inspection.submittedAt && (
                          <span>Signed {formatDate(inspection.submittedAt)}</span>
                        )}
                      </div>
                      <input
                        type="radio"
                        name="inspection"
                        className="sr-only"
                        checked={selectedInspectionId === inspection.id}
                        value={inspection.id}
                        onChange={() => setSelectedInspectionId(inspection.id)}
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section
          className={`bg-white border border-gray-200 rounded-xl p-6 ${
            !selectedInspectionId ? "opacity-60" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Step 3
              </p>
              <h2 className="text-lg font-semibold text-gray-900">
                Select Template
              </h2>
              <p className="text-sm text-gray-600">
                Choose the agreement template to send for signing
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-600">Required</span>
          </div>

          {!selectedInspectionId ? (
            <p className="mt-4 text-sm text-gray-500">
              Complete the previous steps to pick a template.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {templates.map((template) => (
                <label
                  key={template.id}
                  className={`w-full rounded-lg border px-4 py-3 transition ${
                    selectedTemplateId === template.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {template.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        Updated {formatDate(template.updatedAt)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        template.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {template.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="template"
                    className="sr-only"
                    checked={selectedTemplateId === template.id}
                    value={template.id}
                    onChange={() => setSelectedTemplateId(template.id)}
                  />
                </label>
              ))}
            </div>
          )}
        </section>
      </div>

      <aside className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
          <p className="mt-1 text-sm text-gray-600">
            Review your selections before creating the agreement.
          </p>
          <dl className="mt-4 space-y-3 text-sm text-gray-700">
            <div>
              <dt className="text-gray-500">Vehicle</dt>
              <dd className="font-semibold">
                {selectedVehicle
                  ? `${formatVehicleLabel(selectedVehicle)} (${selectedVehicle.licensePlate})`
                  : "Not selected"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Inspection</dt>
              <dd className="font-semibold">
                {selectedInspection
                  ? `${formatDate(selectedInspection.updatedAt)} ${formatTime(selectedInspection.updatedAt)}`
                  : "Not selected"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Template</dt>
              <dd className="font-semibold">
                {selectedTemplate ? selectedTemplate.title : "Not selected"}
              </dd>
            </div>
          </dl>
          {submitError && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              submitting ||
              !selectedVehicleId ||
              !selectedInspectionId ||
              !selectedTemplateId
            }
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating Agreement..." : "Create Agreement"}
          </button>
          <p className="mt-2 text-xs text-gray-500">
            Agreements start in Draft and can be sent for signatures from the
            agreement detail page.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
          Need a new template? Visit the Templates page to add or edit
          agreement content.
          <Link
            href="/dashboard/agreements/templates"
            className="mt-3 block text-sm font-semibold text-blue-600 hover:underline"
          >
            Manage Templates
          </Link>
        </div>
      </aside>
    </div>
  );
}
