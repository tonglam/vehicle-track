"use client";

import { Toast } from "@/components/ui/toast";
import { persistToast, type ToastPayload } from "@/components/ui/toast-storage";
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
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(
    null
  );

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

  const showPrerequisiteError = () => {
    const message = "Please select a vehicle and inspection first.";
    setSubmitError(message);
    setToast({ message, type: "error" });
  };

  const createAgreementAndRedirect = async (templateId: string) => {
    if (!selectedVehicleId || !selectedInspectionId) {
      showPrerequisiteError();
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    setCreatingTemplateId(templateId);

    try {
      const response = await fetch("/api/agreements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleId: selectedVehicleId,
          inspectionId: selectedInspectionId,
          templateId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.error || "Failed to create agreement";
        setSubmitError(message);
        setToast({ message, type: "error" });
        return;
      }

      const agreementId = data.agreement?.id;
      if (!agreementId) {
        const message = "Agreement response missing identifier";
        setSubmitError(message);
        setToast({ message, type: "error" });
        return;
      }

      const successToast: ToastPayload = {
        message: "Agreement created. Finalise the content next.",
        type: "success",
      };
      persistToast(successToast);
      router.push(`/dashboard/agreements/${agreementId}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create agreement";
      setSubmitError(message);
      setToast({ message, type: "error" });
    } finally {
      setSubmitting(false);
      setCreatingTemplateId(null);
    }
  };

  const handleTemplateClick = (templateId: string) => {
    if (!selectedVehicleId || !selectedInspectionId) {
      showPrerequisiteError();
      return;
    }
    setSelectedTemplateId(templateId);
    void createAgreementAndRedirect(templateId);
  };

  const handleSubmit = async () => {
    if (!selectedTemplateId) {
      const message = "Please choose a template to continue.";
      setSubmitError(message);
      setToast({ message, type: "error" });
      return;
    }

    await createAgreementAndRedirect(selectedTemplateId);
  };

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);
  const selectedInspection = inspections.find(
    (inspection) => inspection.id === selectedInspectionId
  );
  const selectedTemplate = templates.find(
    (template) => template.id === selectedTemplateId
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
              {selectedVehicle && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900 flex flex-wrap items-center gap-3">
                  <div className="font-semibold">
                    {formatVehicleLabel(selectedVehicle)}
                  </div>
                  <span className="text-xs text-blue-700 bg-white rounded-full px-3 py-1 border border-blue-100">
                    Plate: {selectedVehicle.licensePlate || "N/A"}
                  </span>
                </div>
              )}

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
                  {inspections.map((inspection) => {
                    const isSelected = selectedInspectionId === inspection.id;
                    return (
                      <button
                        type="button"
                        key={inspection.id}
                        onClick={() => setSelectedInspectionId(inspection.id)}
                        aria-pressed={isSelected}
                        className={`w-full text-left rounded-2xl border px-5 py-4 transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200"
                            : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-base font-semibold text-gray-900">
                              Inspection on {formatDate(inspection.updatedAt)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatTime(inspection.updatedAt)}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              inspection.status === "submitted"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {inspection.status === "submitted" ? "Submitted" : "Draft"}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-4 text-sm text-gray-700 sm:grid-cols-3">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                              Inspector
                            </p>
                            <p className="font-medium">
                              {inspection.inspectorName || "Unassigned"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                              Submitted
                            </p>
                            <p className="font-medium">
                              {inspection.submittedAt
                                ? formatDate(inspection.submittedAt)
                                : "Not submitted"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                              Last Updated
                            </p>
                            <p className="font-medium">{formatDate(inspection.updatedAt)}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Selected
                          </div>
                        )}
                      </button>
                    );
                  })}
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
              {selectedInspection && (
                <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Preparing agreement from the inspection completed on {" "}
                  <span className="font-semibold">
                    {formatDate(selectedInspection.updatedAt)} at {formatTime(selectedInspection.updatedAt)}
                  </span>
                  .
                </div>
              )}
              {templates.map((template) => {
                const isSelected = selectedTemplateId === template.id;
                const isProcessing =
                  submitting && creatingTemplateId === template.id;
                return (
                  <button
                    type="button"
                    key={template.id}
                    onClick={() => handleTemplateClick(template.id)}
                    disabled={submitting}
                    aria-pressed={isSelected}
                    className={`w-full rounded-2xl border px-5 py-4 text-left transition-all disabled:cursor-not-allowed ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200"
                        : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-gray-900">
                          {template.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          Updated {formatDate(template.updatedAt)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          template.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {template.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                      <p>
                        {template.active
                          ? "Available for immediate signature collection."
                          : "This template is currently inactive."}
                      </p>
                    </div>
                    {isProcessing ? (
                      <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                        <svg
                          className="h-4 w-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 12a8 8 0 018-8"
                          />
                        </svg>
                        Preparing editor...
                      </div>
                    ) : (
                      isSelected && (
                        <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Selected
                        </div>
                      )
                    )}
                  </button>
                );
              })}
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
    </>
  );
}
