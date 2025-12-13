"use client";

import { Modal } from "@/components/ui/modal";
import { Toast, type ToastType } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

type InspectionStatus = "draft" | "submitted";

type PendingAction = "submit" | "delete" | null;

interface InspectionActionsProps {
  inspectionId: string;
  status: InspectionStatus;
}

export function InspectionActions({
  inspectionId,
  status,
}: InspectionActionsProps) {
  const router = useRouter();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(
    null
  );

  const isSubmitted = status === "submitted";
  const isBusy = pendingAction !== null;
  const submitButtonBase =
    "inline-flex items-center rounded-lg border px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const submitButtonVariant = isSubmitted
    ? "border-green-200 text-green-700 bg-green-50"
    : "border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100";

  const closeSubmitModal = () => {
    if (pendingAction === "submit") return;
    setShowSubmitModal(false);
  };

  const closeDeleteModal = () => {
    if (pendingAction === "delete") return;
    setShowDeleteModal(false);
  };

  const handleSubmit = async () => {
    setPendingAction("submit");
    try {
      const response = await fetch(`/api/inspections/${inspectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "submitted" }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to submit inspection.");
      }

      setToast({ message: "Inspection submitted", type: "success" });
      setShowSubmitModal(false);
      router.refresh();
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Failed to submit inspection.",
        type: "error",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleDelete = async () => {
    setPendingAction("delete");
    try {
      const response = await fetch(`/api/inspections/${inspectionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to delete inspection.");
      }

      router.push("/dashboard/inspections");
      router.refresh();
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete inspection.",
        type: "error",
      });
    } finally {
      setPendingAction(null);
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowSubmitModal(true)}
        disabled={isSubmitted || isBusy}
        className={`${submitButtonBase} ${submitButtonVariant}`}
        title={isSubmitted ? "Inspection already submitted" : undefined}
      >
        {isSubmitted
          ? "Submitted"
          : pendingAction === "submit"
            ? "Submitting..."
            : "Submit"}
      </button>

      <button
        type="button"
        onClick={() => setShowDeleteModal(true)}
        disabled={isBusy}
        className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pendingAction === "delete" ? "Deleting..." : "Delete"}
      </button>

      <Modal
        isOpen={showSubmitModal}
        onClose={closeSubmitModal}
        title="Submit inspection?"
        type="warning"
        primaryAction={{
          label: "Submit Inspection",
          onClick: handleSubmit,
          loading: pendingAction === "submit",
        }}
        secondaryAction={{ label: "Cancel", onClick: closeSubmitModal }}
      >
        <p>
          Submitting locks the current details and notifies downstream workflows.
          Are you sure you want to submit this inspection?
        </p>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        title="Delete inspection?"
        type="danger"
        primaryAction={{
          label: "Delete Inspection",
          onClick: handleDelete,
          loading: pendingAction === "delete",
        }}
        secondaryAction={{ label: "Cancel", onClick: closeDeleteModal }}
      >
        <p>
          This inspection will be permanently removed. This action cannot be
          undone.
        </p>
      </Modal>

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
