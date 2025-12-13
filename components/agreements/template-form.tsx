"use client";

import { RichTextEditor } from "@/components/ui/rich-text-editor";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TemplateFormState {
  title: string;
  contentRichtext: string;
  active: boolean;
}

const VARIABLE_SECTIONS = [
  {
    title: "Vehicle Information",
    items: [
      { variable: "{{ vehicle.make }}", description: "Vehicle Make" },
      { variable: "{{ vehicle.model }}", description: "Vehicle Model" },
      { variable: "{{ vehicle.year }}", description: "Vehicle Year" },
      { variable: "{{ vehicle.vin }}", description: "Vehicle VIN" },
      { variable: "{{ vehicle.license_plate }}", description: "License Plate" },
    ],
  },
  {
    title: "Inspection Details",
    items: [
      { variable: "{{ inspection.date }}", description: "Inspection Date" },
      {
        variable: "{{ inspection.exterior_condition }}",
        description: "Exterior Condition",
      },
      {
        variable: "{{ inspection.interior_condition }}",
        description: "Interior Condition",
      },
      {
        variable: "{{ inspection.mechanical_condition }}",
        description: "Mechanical Condition",
      },
    ],
  },
  {
    title: "Organisation",
    items: [
      { variable: "{{ organisation.name }}", description: "Organisation Name" },
    ],
  },
];

export function AgreementTemplateForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<TemplateFormState>({
    title: "",
    contentRichtext: "",
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVariables, setShowVariables] = useState(false);

  const handleChange = (
    field: keyof TemplateFormState,
    value: TemplateFormState[typeof field]
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateDefault = () => {
    const defaultTitle = "Vehicle Rental Agreement";
    const defaultContent = `
<h2>Vehicle Rental Agreement</h2>
<p>This agreement confirms that {{ organisation.name }} has issued the following vehicle for use:</p>

<h3>Vehicle Details</h3>
<ul>
  <li><strong>Make:</strong> {{ vehicle.make }}</li>
  <li><strong>Model:</strong> {{ vehicle.model }}</li>
  <li><strong>Year:</strong> {{ vehicle.year }}</li>
  <li><strong>VIN:</strong> {{ vehicle.vin }}</li>
  <li><strong>License Plate:</strong> {{ vehicle.license_plate }}</li>
</ul>

<h3>Inspection Summary</h3>
<p>The most recent handover inspection took place on {{ inspection.date }} with the following notes:</p>
<ul>
  <li><strong>Exterior Condition:</strong> {{ inspection.exterior_condition }}</li>
  <li><strong>Interior Condition:</strong> {{ inspection.interior_condition }}</li>
  <li><strong>Mechanical Condition:</strong> {{ inspection.mechanical_condition }}</li>
</ul>

<p>By signing, the driver acknowledges receipt of the vehicle in the above condition and agrees to follow all safety and reporting requirements.</p>
`;

    setFormState((prev) => ({
      ...prev,
      title: prev.title.trim().length > 0 ? prev.title : defaultTitle,
      contentRichtext: defaultContent.trim(),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.title.trim() || !formState.contentRichtext.trim()) {
      setError("Title and content are required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/agreements/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formState.title.trim(),
          contentRichtext: formState.contentRichtext,
          active: formState.active,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create template");
      }

      router.push("/dashboard/agreements/templates?status=created");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Template Title
            </label>
            <input
              type="text"
              value={formState.title}
              onChange={(event) => handleChange("title", event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Vehicle Rental Agreement"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Template Content
            </label>
            <div className="mt-2">
              <RichTextEditor
                value={formState.contentRichtext}
                onChange={(value) => handleChange("contentRichtext", value)}
                placeholder="Enter agreement details with {{ vehicle.make }} variables..."
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Need placeholder fields? Use the variable reference button to the
              right.
            </p>
          </div>
          <label className="inline-flex items-center gap-3 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={formState.active}
              onChange={(event) => handleChange("active", event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Template is active
          </label>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={handleGenerateDefault}
            className="inline-flex items-center justify-center rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            Generate Default Template
          </button>
          <Link
            href="/dashboard/agreements/templates"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Saving Template..." : "Save Template"}
          </button>
        </div>
      </form>

      <button
        type="button"
        onClick={() => setShowVariables(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-gray-800"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
          />
        </svg>
        View Available Variables
      </button>

      <VariableReferencePanel open={showVariables} onClose={() => setShowVariables(false)} />
    </>
  );
}

function VariableReferencePanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/30"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Reference
            </p>
            <h3 className="text-lg font-semibold text-gray-900">
              Available Variables
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
            aria-label="Close variable reference"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="h-full overflow-y-auto px-6 py-5 space-y-6">
          {VARIABLE_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                {section.title}
              </p>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div
                    key={item.variable}
                    className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <span className="font-mono text-xs text-red-600">
                      {item.variable}
                    </span>
                    <p className="text-sm text-gray-700">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
