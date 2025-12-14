"use client";

import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Toast } from "@/components/ui/toast";
import type { AgreementFinaliseContext } from "@/types";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
        setToast({ message: "Draft saved locally.", type: "info" });
      } finally {
        setSubmitting(null);
      }
      return;
    }

    setSubmitting("final");
    try {
      if (!content.trim()) {
        throw new Error("Agreement content is required before generating.");
      }
      const response = await fetch(`/api/agreements/${agreement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate agreement");
      }
      setToast({ message: "Agreement generated successfully", type: "success" });
      router.push(`/dashboard/agreements/${agreement.id}/preview`);
    } catch (error) {
      console.error(error);
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Unable to process agreement. Please try again.",
        type: "error",
      });
    } finally {
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
            onClick={() => handleAction("final")}
            disabled={submitting !== null}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting === "final" ? "Generating..." : "Generate Agreement"}
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
    </div>
  );
}
