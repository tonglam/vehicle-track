import { TemplateTable } from "@/components/agreements/template-table";
import { requireRole } from "@/lib/auth-utils";
import { listAgreementTemplatesSummary } from "@/lib/services/agreement.service";
import Link from "next/link";

export default async function AgreementTemplatesPage() {
  await requireRole(["admin", "manager"]);
  const templates = await listAgreementTemplatesSummary();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agreement Templates</h1>
          <p className="mt-2 text-gray-600">
            Manage reusable agreement content for your vehicles and drivers.
          </p>
        </div>
        <div className="inline-flex rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <Link
            href="/dashboard/agreements"
            className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
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
            Back to Agreements
          </Link>
          <Link
            href="/dashboard/agreements/templates/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700"
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
                d="M12 5v14m7-7H5"
              />
            </svg>
            New Template
          </Link>
        </div>
      </div>

      <TemplateTable templates={templates} />
    </div>
  );
}
