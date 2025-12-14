"use client";

import { useMemo, useRef, useState } from "react";
import type { AgreementSigningContext } from "@/types";
import { Toast } from "@/components/ui/toast";
import { SignaturePad, type SignaturePadHandle } from "./signature-pad";

interface DriverSigningViewProps {
  context: AgreementSigningContext;
}

function renderAgreementContent(context: AgreementSigningContext) {
  if (!context.agreementHtml) {
    return "";
  }

  const inspection = context.inspection;
  const replacements: Record<string, string> = {
    "organisation.name": context.organizationName ?? "",
    "vehicle.make": inspection?.vehicleMake ?? context.vehicle.displayName,
    "vehicle.model": inspection?.vehicleModel ?? "",
    "vehicle.year": inspection?.vehicleYear?.toString() ?? "",
    "vehicle.vin": inspection?.vehicleVin ?? "",
    "vehicle.license_plate": context.vehicle.licensePlate ?? "",
    "inspection.date": inspection ? formatDate(inspection.date) : "",
    "inspection.exterior_condition": inspection?.exteriorCondition ?? "",
    "inspection.interior_condition": inspection?.interiorCondition ?? "",
    "inspection.mechanical_condition": inspection?.mechanicalCondition ?? "",
  };

  return context.agreementHtml.replace(/{{\s*([^}]+?)\s*}}/g, (_, token) => {
    const key = token.trim();
    return replacements[key] ?? "";
  });
}

function formatDate(value: Date | string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatFileSize(bytes: number) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

const statusStyles: Record<string, string> = {
  pending_signature: "bg-amber-100 text-amber-800",
  signed: "bg-emerald-100 text-emerald-800",
  draft: "bg-gray-200 text-gray-700",
  terminated: "bg-red-100 text-red-700",
};

export function DriverSigningView({ context }: DriverSigningViewProps) {
  const signatureRef = useRef<SignaturePadHandle>(null);
  const [toast, setToast] = useState<
    { message: string; type: "success" | "error" | "info" | "warning" } | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(context.status);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const statusBadge = useMemo(() => {
    const style = statusStyles[status] ?? "bg-gray-200 text-gray-700";
    const label = status.replace("_", " ");
    return (
      <span className={`inline-flex items-center rounded-full px-4 py-1 text-sm font-semibold capitalize ${style}`}>
        {label}
      </span>
    );
  }, [status]);

  const submittingDisabled = status === "signed" || submitting;

  const handleSubmit = async () => {
    if (status === "signed") {
      setToast({ message: "This agreement is already signed.", type: "info" });
      return;
    }

    if (!signatureData) {
      setToast({ message: "Please add your signature before submitting.", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/agreements/${context.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: context.signingToken, signature: signatureData }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Unable to submit signature");
      }
      setToast({ message: "Thanks! Your signature has been recorded.", type: "success" });
      setStatus("signed");
      signatureRef.current?.clear();
      setSignatureData(null);
    } catch (error) {
      console.error(error);
      setToast({
        message:
          error instanceof Error ? error.message : "Unable to submit signature. Please try again.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
    setSignatureData(null);
  };

  const renderedAgreementHtml = useMemo(() => renderAgreementContent(context), [context]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 border-b border-gray-200 pb-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Driver Signing Portal
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              VEHICLE RENTAL AGREEMENT
            </h1>
            <p className="mt-2 text-gray-600">
              {context.vehicle.displayName}
              <span className="mx-2 text-gray-400">•</span>
              <span className="font-semibold">{context.vehicle.licensePlate}</span>
            </p>
          </div>
          <div className="space-y-2 text-right">
            {statusBadge}
            <p className="text-sm text-gray-500">Agreement ID · {context.id}</p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="space-y-6">
            <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Agreement Preview</h2>
                  <p className="text-sm text-gray-500">Review the entire contract before signing.</p>
                </div>
              </div>
              <div
                className="prose prose-sm max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: renderedAgreementHtml }}
              />
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Vehicle Inspection</h2>
                  <p className="text-sm text-gray-500">Latest condition report for reference.</p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Reference only
                </span>
              </div>
              {context.inspection ? (
                <dl className="grid gap-4 text-sm text-gray-700 sm:grid-cols-2">
                  <div>
                    <dt className="text-gray-500">Inspection Date</dt>
                    <dd className="font-semibold">{formatDate(context.inspection.date)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Inspector</dt>
                    <dd className="font-semibold">{context.inspection.inspector ?? "Unassigned"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Exterior</dt>
                    <dd>{context.inspection.exteriorCondition ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Interior</dt>
                    <dd>{context.inspection.interiorCondition ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Mechanical</dt>
                    <dd>{context.inspection.mechanicalCondition ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Notes</dt>
                    <dd>{context.inspection.notes ?? "No additional notes"}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-600">No inspection details available.</p>
              )}
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Supporting Documents</h2>
                <p className="text-sm text-gray-500">Evidence and attachments related to this agreement.</p>
              </div>
              {context.supportingDocuments.length === 0 ? (
                <p className="text-sm text-gray-600">No supporting documents have been provided.</p>
              ) : (
                <ul className="space-y-3">
                  {context.supportingDocuments.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm"
                    >
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {doc.name}
                      </a>
                      <span className="text-xs text-gray-500">{formatFileSize(doc.size)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>

          <aside className="space-y-6">
            <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Agreement Details</h2>
              <dl className="mt-4 space-y-3 text-sm text-gray-700">
                <div>
                  <dt className="text-gray-500">Driver</dt>
                  <dd className="font-semibold">{context.driver.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd>{context.driver.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Mobile</dt>
                  <dd>{context.driver.phone ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Vehicle</dt>
                  <dd>
                    {context.vehicle.displayName} ({context.vehicle.licensePlate})
                  </dd>
                </div>
              </dl>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Sign</h2>
              <p className="mt-2 text-sm text-gray-600">
                Use your mouse or touch to sign below. Your digital signature confirms acceptance of this agreement.
              </p>
              <div className="mt-4">
                <SignaturePad
                  ref={signatureRef}
                  onChange={setSignatureData}
                  disabled={status === "signed"}
                />
                <div className="mt-3 flex justify-between text-sm">
                  <button
                    type="button"
                    onClick={clearSignature}
                    disabled={status === "signed"}
                    className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  >
                    Clear signature
                  </button>
                  <span className="text-gray-500">
                    {signatureData ? "Signature captured" : "Awaiting signature"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submittingDisabled}
                className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting..." : status === "signed" ? "Signature submitted" : "Submit signature"}
              </button>
            </article>
          </aside>
        </div>
      </div>
    </main>
  );
}
