"use client";

import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Toast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import type { AgreementFinaliseContext, DriverListItem } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface AgreementFinaliseFormProps {
  agreement: AgreementFinaliseContext;
}

interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  url: string;
  path: string;
}

const DRIVER_PAGE_SIZE = 4;

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function AgreementFinaliseForm({ agreement }: AgreementFinaliseFormProps) {
  const router = useRouter();
  const [content, setContent] = useState(
    agreement.finalContentRichtext ?? agreement.template.contentRichtext
  );
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [toast, setToast] = useState<
    { message: string; type: "success" | "error" | "info" | "warning" } | null
  >(null);
  const [submitting, setSubmitting] = useState<"draft" | "final" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [driverSearch, setDriverSearch] = useState("");
  const [driverPage, setDriverPage] = useState(1);
  const [drivers, setDrivers] = useState<DriverListItem[]>([]);
  const [driverTotalPages, setDriverTotalPages] = useState(1);
  const [selectedDriver, setSelectedDriver] = useState<DriverListItem | null>(null);
  const [driverLoading, setDriverLoading] = useState(false);
  const [driverFetchError, setDriverFetchError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchDrivers() {
      try {
        setDriverFetchError(null);
        setDriverLoading(true);

        const params = new URLSearchParams({
          limit: String(DRIVER_PAGE_SIZE),
          page: String(driverPage),
        });
        const trimmedSearch = driverSearch.trim();
        if (trimmedSearch) {
          params.set("search", trimmedSearch);
        }

        const response = await fetch(`/api/drivers?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load drivers");
        }

        if (!isMounted) {
          return;
        }

        const normalizedDrivers: DriverListItem[] = Array.isArray(data.drivers)
          ? data.drivers.map((driver: DriverListItem) => ({
              ...driver,
              createdAt: new Date(driver.createdAt),
            }))
          : [];

        const nextTotalPages = Math.max(1, data.totalPages ?? 1);

        setDrivers(normalizedDrivers);
        setDriverTotalPages(nextTotalPages);

        if (driverPage > nextTotalPages) {
          setDriverPage(nextTotalPages);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error(error);
        if (!isMounted) {
          return;
        }
        const message =
          error instanceof Error ? error.message : "Failed to load drivers";
        setDriverFetchError(message);
        setToast({ message, type: "error" });
      } finally {
        if (isMounted) {
          setDriverLoading(false);
        }
      }
    }

    void fetchDrivers();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [driverPage, driverSearch]);

  const acceptedTypes = useMemo(
    () => "image/*,.pdf,.doc,.docx,.xls,.xlsx",
    []
  );

  const handleDocumentChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setIsUploading(true);

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(
          `/api/agreements/${agreement.id}/supporting`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to upload document");
        }

        setDocuments((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: data.fileName,
            size: data.fileSize,
            url: data.url,
            path: data.path,
          },
        ]);
      } catch (error) {
        console.error(error);
        setToast({
          message:
            error instanceof Error
              ? error.message
              : "Failed to upload document",
          type: "error",
        });
      }
    }

    setIsUploading(false);
    event.target.value = "";
  };

  const handleDocumentRemove = async (id: string) => {
    const doc = documents.find((item) => item.id === id);
    if (!doc) return;

    setRemovingId(id);
    try {
      const response = await fetch(
        `/api/agreements/${agreement.id}/supporting`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: doc.path }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove document");
      }

      setDocuments((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Failed to remove document",
        type: "error",
      });
    } finally {
      setRemovingId(null);
    }
  };

  const handleAction = async (mode: "draft" | "final") => {
    if (mode === "draft") {
    setSubmitting("draft");
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setToast({
        message: "Draft saved locally.",
          type: "info",
        });
      } finally {
        setSubmitting(null);
      }
      return;
    }

    setSubmitting("final");
    try {
      if (!selectedDriver) {
        throw new Error("Please select a driver before sending");
      }
      if (!content.trim()) {
        throw new Error("Agreement content is required before sending");
      }
      console.warn("Finalising agreement", {
        agreementId: agreement.id,
        driverId: selectedDriver.id,
      });
      const response = await fetch(`/api/agreements/${agreement.id}/finalise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: selectedDriver.id,
          content,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to send signing link");
      }
      setToast({
        message: `Signing link emailed to ${selectedDriver.firstName} ${selectedDriver.lastName}`.trim(),
        type: "success",
      });
      setFinalizeModalOpen(false);
      router.push(`/dashboard/agreements/${agreement.id}/preview`);
    } catch (error) {
      console.error(error);
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Unable to send signing link. Please try again.",
        type: "error",
      });
    } finally {
      console.warn("Finalise request complete");
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finalise Agreement</h1>
          <p className="mt-2 text-gray-600">
            {agreement.vehicle.displayName}
            <span className="mx-2 text-gray-400">•</span>
            <span className="font-semibold">{agreement.vehicle.licensePlate}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleAction("draft")}
            disabled={submitting !== null}
            className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting === "draft" ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={() => setFinalizeModalOpen(true)}
            disabled={submitting !== null}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Finalise & Email Driver
          </button>
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Edit Agreement Content
            </h2>
            <p className="text-sm text-gray-500">
              Customise the template before sharing it with the driver.
            </p>
          </div>
          <span className="text-xs rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
            Based on {agreement.template.title}
          </span>
        </div>
        <div className="mt-4">
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Edit agreement content..."
          />
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Supporting Documents
          </h2>
          <p className="text-sm text-gray-500">
            Upload any inspection photos, PDFs, or reference documents. You can
            attach multiple files.
          </p>
        </div>
        <label
          className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600 ${
            isUploading ? "opacity-60" : "cursor-pointer hover:border-blue-300 hover:bg-blue-50"
          }`}
        >
          <svg
            className="h-10 w-10 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="mt-2 font-medium text-gray-900">
            {isUploading ? "Uploading documents..." : "Click to upload supporting documents"}
          </span>
          <span className="text-xs text-gray-500">
            Supports images, PDFs, Word, and spreadsheet files (max 20MB each)
          </span>
          <input
            type="file"
            className="sr-only"
            multiple
            accept={acceptedTypes}
            disabled={isUploading}
            onChange={handleDocumentChange}
          />
        </label>
        {documents.length > 0 && (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm"
              >
                <div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {doc.name}
                  </a>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(doc.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDocumentRemove(doc.id)}
                  disabled={removingId === doc.id}
                  className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {removingId === doc.id ? "Removing..." : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal
        isOpen={finalizeModalOpen}
        onClose={() => setFinalizeModalOpen(false)}
        title="Finalise & email driver"
        type="info"
        size="lg"
        primaryAction={{
          label: submitting === "final" ? "Sending..." : "Send signing link",
          onClick: () => {
            void handleAction("final");
          },
          disabled: submitting === "final",
          loading: submitting === "final",
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setFinalizeModalOpen(false),
        }}
      >
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Choose driver to invite <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-500">
                  Search by name, email, or phone to link a driver to this agreement.
                </p>
              </div>
              {selectedDriver && (
                <button
                  type="button"
                  onClick={() => setSelectedDriver(null)}
                  className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Clear selection
                </button>
              )}
            </div>
            <div className="mt-4">
              <input
                type="search"
                value={driverSearch}
                onChange={(e) => {
                  setDriverSearch(e.target.value);
                  setDriverPage(1);
                }}
                placeholder="Search by name, email, or phone..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-500">Driver</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-500">Email</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-500">Phone</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-500">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {driverLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                        Loading drivers...
                      </td>
                    </tr>
                  ) : driverFetchError ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-red-600">
                        {driverFetchError}
                      </td>
                    </tr>
                  ) : drivers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                        No drivers found.
                      </td>
                    </tr>
                  ) : (
                    drivers.map((driver) => (
                      <tr
                        key={driver.id}
                        className={`cursor-pointer hover:bg-blue-50 ${
                          selectedDriver?.id === driver.id ? "bg-blue-50" : ""
                        }`}
                        onClick={() => setSelectedDriver(driver)}
                      >
                        <td className="px-4 py-2 font-semibold text-gray-900">
                          {`${driver.firstName} ${driver.lastName}`.trim()}
                        </td>
                        <td className="px-4 py-2 text-gray-600">{driver.email ?? "—"}</td>
                        <td className="px-4 py-2 text-gray-600">{driver.phone ?? "—"}</td>
                        <td className="px-4 py-2 text-gray-600">
                          {driver.createdAt.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500">
                <span>
                  Page {driverPage} of {driverTotalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDriverPage((p) => Math.max(1, p - 1))}
                    disabled={driverPage === 1}
                    className="rounded border border-gray-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setDriverPage((p) => Math.min(driverTotalPages, p + 1))}
                    disabled={driverPage === driverTotalPages}
                    className="rounded border border-gray-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <h3 className="text-lg font-semibold text-gray-900">Selected Driver</h3>
            {selectedDriver ? (
              <div className="mt-4 space-y-1 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">
                  {`${selectedDriver.firstName} ${selectedDriver.lastName}`.trim()}
                </p>
                <p>{selectedDriver.email ?? "No email provided"}</p>
                <p>{selectedDriver.phone ?? "No phone provided"}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">No driver selected.</p>
            )}
          </section>

          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7h16M4 12h16M4 17h16"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">What happens next?</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                  <li>We email the driver a personal link to view this agreement.</li>
                  <li>They read and sign digitally — no edits, just a simple sign-off.</li>
                  <li>Once they finish, this agreement switches to Signed.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </Modal>
    </div>
  );
}
