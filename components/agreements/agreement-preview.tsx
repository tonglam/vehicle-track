"use client";

import type { AgreementDetailContext, DriverListItem } from "@/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/toast";
import { persistToast } from "@/components/ui/toast-storage";

interface AgreementPreviewProps {
  agreement: AgreementDetailContext;
}

const DRIVER_PAGE_SIZE = 4;

function formatDate(value: Date | string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatSize(bytes: number) {
  if (!bytes) return "0 KB";
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function AgreementPreview({ agreement }: AgreementPreviewProps) {
  const inspector = agreement.inspection.inspector ?? "Unassigned";
  const imagesBySection = agreement.inspection.images.reduce<
    Record<string, typeof agreement.inspection.images>
  >((acc, image) => {
    const section = image.section ?? "general";
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section]!.push(image);
    return acc;
  }, {});
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [driverSearch, setDriverSearch] = useState("");
  const [driverPage, setDriverPage] = useState(1);
  const [drivers, setDrivers] = useState<DriverListItem[]>([]);
  const [driverTotalPages, setDriverTotalPages] = useState(1);
  const [selectedDriver, setSelectedDriver] = useState<DriverListItem | null>(null);
  const [driverLoading, setDriverLoading] = useState(false);
  const [driverFetchError, setDriverFetchError] = useState<string | null>(null);
  const [sendingSigningLink, setSendingSigningLink] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [selectedInspectionId, setSelectedInspectionId] = useState(
    agreement.availableInspections[0]?.id ?? ""
  );
  const [reason, setReason] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<
    { message: string; type: "success" | "error" | "info" | "warning" } | null
  >(null);
  const router = useRouter();

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

  useEffect(() => {
    if (agreement.availableInspections.length > 0) {
      setSelectedInspectionId(agreement.availableInspections[0]?.id ?? "");
    } else {
      setSelectedInspectionId("");
    }
  }, [agreement.availableInspections]);

  const handleLinkInspection = async () => {
    if (!selectedInspectionId) {
      setToast({ message: "Please select an inspection", type: "error" });
      return;
    }

    try {
      const response = await fetch(`/api/agreements/${agreement.id}/inspection`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspectionId: selectedInspectionId, reason }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to link inspection");
      }
      setToast({ message: "Inspection linked", type: "success" });
      setShowModifyModal(false);
      setReason("");
      router.refresh();
    } catch (error) {
      console.error(error);
      setToast({
        message:
          error instanceof Error ? error.message : "Failed to link inspection",
        type: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/agreements/${agreement.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete agreement");
      }
      persistToast({ message: "Agreement deleted", type: "success" });
      router.push("/dashboard/agreements");
    } catch (error) {
      console.error(error);
      setToast({
        message:
          error instanceof Error ? error.message : "Failed to delete agreement",
        type: "error",
      });
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendSigningLink = async () => {
    if (!selectedDriver) {
      setToast({ message: "Please select a driver", type: "error" });
      return;
    }

    setSendingSigningLink(true);
    try {
      const response = await fetch(`/api/agreements/${agreement.id}/finalise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: selectedDriver.id,
          content: agreement.finalContentRichtext ?? undefined,
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
      setShowFinalizeModal(false);
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
      setSendingSigningLink(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
          <p className="text-sm font-semibold text-gray-500">Status · {agreement.status.replace("_", " ")}</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            VEHICLE RENTAL AGREEMENT
          </h1>
          <p className="mt-1 text-gray-600">
            Template: <span className="font-semibold">{agreement.templateTitle}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/dashboard/agreements/${agreement.id}`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Edit Agreement
          </Link>
          <button
            type="button"
            onClick={() => setShowFinalizeModal(true)}
            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
          >
            Finalise Agreement
          </button>
          <button
            type="button"
            onClick={() => setShowModifyModal(true)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Modify Inspection
          </button>
          <button
            type="button"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete
          </button>
        </div>
      </div>

      <Modal
        isOpen={showFinalizeModal}
        onClose={() => setShowFinalizeModal(false)}
        title="Finalise & email driver"
        size="lg"
        primaryAction={{
          label: sendingSigningLink ? "Sending..." : "Send signing link",
          onClick: handleSendSigningLink,
          disabled: !selectedDriver,
          loading: sendingSigningLink,
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setShowFinalizeModal(false),
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
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
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

      <Modal
        isOpen={showModifyModal}
        onClose={() => setShowModifyModal(false)}
        title="Modify Inspection"
        type="info"
        primaryAction={{
          label: "Link Inspection",
          onClick: handleLinkInspection,
          disabled: !selectedInspectionId,
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setShowModifyModal(false),
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="inspection-select">
              Select Existing Inspection
            </label>
            <select
              id="inspection-select"
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={selectedInspectionId}
              onChange={(event) => setSelectedInspectionId(event.target.value)}
              disabled={agreement.availableInspections.length === 0}
            >
              {agreement.availableInspections.length === 0 ? (
                <option value="">No other inspections available</option>
              ) : (
                agreement.availableInspections.map((insp) => (
                  <option key={insp.id} value={insp.id}>
                    {formatDate(insp.date)} · {insp.status.replace("_", " ")} · {insp.inspector ?? "Unassigned"}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="inspection-reason">
              Reason for Change (optional)
            </label>
            <textarea
              id="inspection-reason"
              rows={4}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide additional context"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          if (isDeleting) return;
          setShowDeleteModal(false);
        }}
        title="Delete Agreement"
        type="danger"
        primaryAction={{
          label: isDeleting ? "Deleting..." : "Delete",
          onClick: handleDelete,
          loading: isDeleting,
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setShowDeleteModal(false),
        }}
      >
        <p className="text-sm text-gray-700">
          This will permanently remove the agreement and its supporting documents.
          This action cannot be undone.
        </p>
      </Modal>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Current Vehicle</h2>
          <p className="mt-2 text-sm text-gray-600">
            Original Vehicle:
            <span className="ml-2 font-semibold">
              {agreement.vehicle.displayName} ({agreement.vehicle.licensePlate})
            </span>
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Status: <span className="font-semibold">{agreement.vehicle.status ?? "Unknown"}</span>
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Ownership: <span className="font-semibold">{agreement.vehicle.ownership ?? "—"}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Vehicle Inspection</h2>
            <Link
              href={`/dashboard/inspections/${agreement.inspection.id}`}
              className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              View Inspection
            </Link>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Vehicle Information
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-700">
                <div>
                  <dt className="text-gray-500">Make</dt>
                  <dd className="font-semibold">
                    {agreement.inspection.vehicleMake ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Model</dt>
                  <dd className="font-semibold">
                    {agreement.inspection.vehicleModel ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Year</dt>
                  <dd className="font-semibold">
                    {agreement.inspection.vehicleYear ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">VIN</dt>
                  <dd className="font-semibold">
                    {agreement.inspection.vehicleVin ?? "—"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Inspection Details
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-700">
                <div>
                  <dt className="text-gray-500">Date</dt>
                  <dd className="font-semibold">
                    {formatDate(agreement.inspection.date)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Inspector</dt>
                  <dd className="font-semibold">{inspector}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Status</dt>
                  <dd className="font-semibold">
                    {agreement.inspection.status.replace("_", " ")}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Exterior Condition",
                value: agreement.inspection.exteriorCondition,
                section: "exterior",
              },
              {
                title: "Interior Condition",
                value: agreement.inspection.interiorCondition,
                section: "interior",
              },
              {
                title: "Mechanical Condition",
                value: agreement.inspection.mechanicalCondition,
                section: "mechanical",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {item.title}
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  {item.value || "No details provided"}
                </p>
                {imagesBySection[item.section]?.length ? (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {imagesBySection[item.section]?.map((image) => (
                      <a
                        key={image.id}
                        href={image.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-lg border border-gray-200"
                        title={image.name}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt={image.name}
                          className="h-20 w-20 object-cover"
                        />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Additional Notes
            </p>
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
              {agreement.inspection.notes || "No additional notes"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Supporting Documents</h2>
          </div>
          {agreement.supportingDocuments.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">
              No supporting documents have been uploaded.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {agreement.supportingDocuments.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm"
                >
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    {doc.name}
                  </a>
                  <span className="text-xs text-gray-500">
                    {formatSize(doc.size)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
