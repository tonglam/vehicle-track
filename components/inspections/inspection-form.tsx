"use client";

import type { VehicleOption } from "@/types";
import { Toast, type ToastType } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

interface InspectionImageData {
  id: string;
  section: InspectionImageSection;
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  contentType: string;
}

interface InspectionFormProps {
  vehicles: VehicleOption[];
  inspection?: {
    id: string;
    vehicleId: string;
    status: "draft" | "submitted";
    exteriorCondition: string;
    interiorCondition: string;
    mechanicalCondition: string;
    additionalNotes: string | null;
    images?: InspectionImageData[];
  };
}

interface FormState {
  vehicleId: string;
  status: "draft" | "submitted";
  exteriorCondition: string;
  interiorCondition: string;
  mechanicalCondition: string;
  additionalNotes: string;
}

type InspectionSectionField =
  | "exteriorCondition"
  | "interiorCondition"
  | "mechanicalCondition";

type InspectionImageSection = "exterior" | "interior" | "mechanical";

const SECTION_LOOKUP: Record<InspectionSectionField, InspectionImageSection> = {
  exteriorCondition: "exterior",
  interiorCondition: "interior",
  mechanicalCondition: "mechanical",
};

const SECTION_FIELD_LOOKUP: Record<InspectionImageSection, InspectionSectionField> = {
  exterior: "exteriorCondition",
  interior: "interiorCondition",
  mechanical: "mechanicalCondition",
};

interface UploadedImage {
  url: string;
  name: string;
  size: number;
  type: string;
  path: string;
  section: InspectionImageSection;
}

export function InspectionForm({ vehicles, inspection }: InspectionFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(inspection);
  const initialFormState: FormState = {
    vehicleId: inspection?.vehicleId ?? "",
    status: inspection?.status ?? "draft",
    exteriorCondition: inspection?.exteriorCondition ?? "",
    interiorCondition: inspection?.interiorCondition ?? "",
    mechanicalCondition: inspection?.mechanicalCondition ?? "",
    additionalNotes: inspection?.additionalNotes ?? "",
  };
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(
    null
  );
  const initialUploadsState: Record<InspectionSectionField, UploadedImage[]> = {
    exteriorCondition: [],
    interiorCondition: [],
    mechanicalCondition: [],
  };

  if (inspection?.images) {
    inspection.images.forEach((image) => {
      const field = SECTION_FIELD_LOOKUP[image.section];
      if (!field) return;
      initialUploadsState[field].push({
        url: image.fileUrl,
        path: image.fileUrl,
        name: image.fileName,
        size: image.fileSizeBytes,
        type: image.contentType,
        section: image.section,
      });
    });
  }

  const [uploads, setUploads] = useState<
    Record<InspectionSectionField, UploadedImage[]>
  >(initialUploadsState);
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const fileInputRefs: Record<
    InspectionSectionField,
    React.MutableRefObject<HTMLInputElement | null>
  > = {
    exteriorCondition: useRef<HTMLInputElement | null>(null),
    interiorCondition: useRef<HTMLInputElement | null>(null),
    mechanicalCondition: useRef<HTMLInputElement | null>(null),
  };

  const handleChange = (
    field: keyof FormState,
    value: string
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (
    section: InspectionSectionField,
    file: File
  ) => {
    setUploadingSection(section);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("section", SECTION_LOOKUP[section]);

      const response = await fetch("/api/inspections/images", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to upload image");
      }

      const data = await response.json();
      setUploads((prev) => ({
        ...prev,
        [section]: [
          ...prev[section],
          {
            url: data.url,
            path: data.path,
            name: file.name,
            size: file.size,
            type: file.type || "application/octet-stream",
            section: SECTION_LOOKUP[section],
          },
        ],
      }));
      setToast({ message: "Image uploaded", type: "success" });
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : "Failed to upload image",
        type: "error",
      });
    } finally {
      setUploadingSection(null);
    }
  };

  const handleRemoveUpload = (
    section: InspectionSectionField,
    url: string
  ) => {
    setUploads((prev) => ({
      ...prev,
      [section]: prev[section].filter((upload) => upload.url !== url),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const requiredErrors: string[] = [];

    if (!formState.vehicleId) requiredErrors.push("Vehicle is required");
    if (!formState.exteriorCondition.trim())
      requiredErrors.push("Exterior condition is required");
    if (!formState.interiorCondition.trim())
      requiredErrors.push("Interior condition is required");
    if (!formState.mechanicalCondition.trim())
      requiredErrors.push("Mechanical condition is required");

    if (requiredErrors.length > 0) {
      setToast({
        message: requiredErrors[0] ?? "Please complete required fields",
        type: "warning",
      });
      return;
    }

    setSubmitting(true);
    setToast(null);

    try {
      const imagePayload = (Object.entries(uploads) as [
        InspectionSectionField,
        UploadedImage[],
      ][]).flatMap(([, files]) =>
        files.map((file) => ({
          section: file.section,
          fileUrl: file.url,
          fileName: file.name,
          fileSizeBytes: file.size,
          contentType: file.type || "application/octet-stream",
        }))
      );

      const normalizedNotes = formState.additionalNotes?.trim();
      const payload = {
        vehicleId: formState.vehicleId,
        exteriorCondition: formState.exteriorCondition,
        interiorCondition: formState.interiorCondition,
        mechanicalCondition: formState.mechanicalCondition,
        additionalNotes: normalizedNotes ? normalizedNotes : undefined,
        images: imagePayload,
      };

      const endpoint = isEditMode && inspection
        ? `/api/inspections/${inspection.id}`
        : "/api/inspections";
      const method = isEditMode ? "PUT" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditMode ? payload : { ...payload, status: formState.status }
        ),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save inspection");
      }

      const redirectTarget = isEditMode && inspection
        ? `/dashboard/inspections/${inspection.id}`
        : "/dashboard/inspections?status=created";
      router.push(redirectTarget);
      router.refresh();
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Failed to save inspection",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Vehicle & Conditions</h2>
            <p className="mt-1 text-sm text-gray-500">
              Vehicle*, Exterior Condition*, Interior Condition*, Mechanical Condition*; these
              fields are required.
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Vehicle<span className="text-red-500">*</span>
              </label>
              <select
                value={formState.vehicleId}
                onChange={(event) => handleChange("vehicleId", event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select vehicle...</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.licensePlate} — {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>

            {[
              {
                label: "Exterior Condition",
                value: formState.exteriorCondition,
                field: "exteriorCondition" as InspectionSectionField,
              },
              {
                label: "Interior Condition",
                value: formState.interiorCondition,
                field: "interiorCondition" as InspectionSectionField,
              },
              {
                label: "Mechanical Condition",
                value: formState.mechanicalCondition,
                field: "mechanicalCondition" as InspectionSectionField,
              },
            ].map((section) => (
              <div key={section.field} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {section.label}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={section.value}
                  onChange={(event) => handleChange(section.field, event.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="space-y-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Supporting Images</p>
                    <button
                      type="button"
                      onClick={() => fileInputRefs[section.field].current?.click()}
                      className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      disabled={uploadingSection === section.field}
                    >
                      {uploadingSection === section.field
                        ? "Uploading..."
                        : "Upload Photos"}
                    </button>
                  </div>
                  <input
                    ref={fileInputRefs[section.field]}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      await handleImageUpload(section.field, file);
                      event.target.value = "";
                    }
                  }}
                />
                  {uploads[section.field].length > 0 && (
                    <ul className="space-y-1 text-sm text-blue-600">
                      {uploads[section.field].map((upload) => (
                        <li
                          key={upload.url}
                          className="flex items-center justify-between gap-2"
                        >
                          <a
                            href={upload.url}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate"
                          >
                            {upload.name}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveUpload(section.field, upload.url)}
                            className="text-xs font-medium text-gray-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Additional Notes (optional)
              </label>
              <textarea
                value={formState.additionalNotes}
                onChange={(event) => handleChange("additionalNotes", event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() =>
              router.push(
                isEditMode && inspection
                  ? `/dashboard/inspections/${inspection.id}`
                  : "/dashboard/inspections"
              )
            }
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting
              ? isEditMode
                ? "Saving..."
                : "Saving Draft..."
              : isEditMode
                ? "Update Inspection"
                : "Save & Preview"}
          </button>
        </div>
      </form>

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
