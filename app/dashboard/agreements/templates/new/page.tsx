import { AgreementTemplateForm } from "@/components/agreements/template-form";
import { requireRole } from "@/lib/auth-utils";
import Link from "next/link";

export default async function NewAgreementTemplatePage() {
  await requireRole(["admin", "manager"]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Agreement Template</h1>
          <p className="mt-2 text-gray-600">
            Create reusable agreement content that can be applied to any vehicle
            inspection.
          </p>
        </div>
        <Link
          href="/dashboard/agreements/templates"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Templates
        </Link>
      </div>

      <AgreementTemplateForm />
    </div>
  );
}
