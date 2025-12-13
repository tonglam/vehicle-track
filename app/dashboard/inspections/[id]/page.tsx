import { requireAuth } from "@/lib/auth-utils";
import { getInspectionById } from "@/lib/services/inspection.service";
import Link from "next/link";
import { notFound } from "next/navigation";

import { InspectionActions } from "./inspection-actions";

function formatDate(value: Date | string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  submitted: "bg-green-100 text-green-800",
};

type InspectionImage = {
  id: string;
  section: string;
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  contentType: string;
  createdAt: Date;
};

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const inspection = await getInspectionById(id);

  if (!inspection) {
    notFound();
  }

  const vehicleDetails = [
    { label: "Year", value: inspection.vehicleYear?.toString() ?? "—" },
    { label: "Make", value: inspection.vehicleMake || "—" },
    { label: "Model", value: inspection.vehicleModel || "—" },
    { label: "VIN", value: inspection.vehicleVin || "—" },
    {
      label: "License Plate",
      value: inspection.vehicleLicensePlate || "—",
    },
  ];
  const isSubmitted = inspection.status === "submitted";
  const inspectionImages = (inspection.images ?? []) as InspectionImage[];
  const imagesBySection = inspectionImages.reduce<Record<string, InspectionImage[]>>(
    (acc, image) => {
      if (!acc[image.section]) {
        acc[image.section] = [];
      }
      acc[image.section]!.push(image);
      return acc;
    },
    {}
  );
  const conditionSections = [
    {
      label: "Exterior Condition",
      value: inspection.exteriorCondition,
      description: "Body panels, paint, glass and accessories.",
      sectionKey: "exterior",
    },
    {
      label: "Interior Condition",
      value: inspection.interiorCondition,
      description: "Cabin trim, seating, controls and electronics.",
      sectionKey: "interior",
    },
    {
      label: "Mechanical Condition",
      value: inspection.mechanicalCondition,
      description: "Powertrain, suspension and drivetrain observations.",
      sectionKey: "mechanical",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Inspection
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              {inspection.vehicleDisplayName}
            </h1>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {vehicleDetails.map((detail) => (
                <div
                  key={detail.label}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {detail.label}
                  </dt>
                  <dd
                    className={`mt-1 text-sm text-gray-900 ${
                      detail.label === "VIN"
                        ? "font-mono text-xs tracking-tight break-all"
                        : "font-medium"
                    }`}
                  >
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/inspections"
              className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back
            </Link>
            {!isSubmitted ? (
              <>
                <Link
                  href={`/dashboard/inspections/${inspection.id}/edit`}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Edit
                </Link>
                <InspectionActions
                  inspectionId={inspection.id}
                  status={inspection.status === "submitted" ? "submitted" : "draft"}
                />
              </>
            ) : (
              <Link
                href="/dashboard/inspections"
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Create
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </p>
              <span
                className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  STATUS_STYLES[inspection.status] || "bg-gray-100 text-gray-800"
                }`}
              >
                {inspection.status === "submitted" ? "Submitted" : "Draft"}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Inspector
              </p>
              <p className="text-sm text-gray-900">
                {inspection.inspectorName || "Unassigned"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Created
              </p>
              <p className="text-sm text-gray-900">{formatDate(inspection.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Last Updated
              </p>
              <p className="text-sm text-gray-900">{formatDate(inspection.updatedAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Submitted
              </p>
              <p className="text-sm text-gray-900">{formatDate(inspection.submittedAt)}</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          {conditionSections.map((section) => {
            const sectionImages = imagesBySection[section.sectionKey] ?? [];
            return (
              <div
                key={section.sectionKey}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {section.label}
                    </p>
                    <p className="mt-2 text-sm text-gray-900 whitespace-pre-line">
                      {section.value || "—"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{section.description}</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 7h18M3 12h18M3 17h18"
                      />
                    </svg>
                    {sectionImages.length} photos
                  </span>
                </div>
                {sectionImages.length > 0 ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {sectionImages.map((image) => (
                      <a
                        key={image.id}
                        href={image.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group"
                      >
                        <div className="aspect-video overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image.fileUrl}
                            alt={`${section.label} photo ${image.fileName}`}
                            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                        <p className="mt-2 text-xs font-medium text-gray-600 truncate">
                          {image.fileName}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {(image.fileSizeBytes / 1024).toFixed(1)} KB
                        </p>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500">
                    No supporting photos uploaded for this section.
                  </p>
                )}
              </div>
            );
          })}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-blue-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 7h10M7 11h6m-8 6h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                Additional Notes
              </h2>
            </div>
            <p className="mt-3 text-sm text-gray-900 whitespace-pre-line">
              {inspection.additionalNotes || "No additional notes provided."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
