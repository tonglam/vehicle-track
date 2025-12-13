import { requireRole } from "@/lib/auth-utils";
import {
  getAgreementTemplateById,
} from "@/lib/services/agreement.service";
import Link from "next/link";
import { notFound } from "next/navigation";

interface TemplatePageProps {
  params: Promise<{ id: string }>;
}

function formatDate(date: Date) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function TemplateDetailPage({ params }: TemplatePageProps) {
  await requireRole(["admin", "manager"]);
  const { id } = await params;
  const template = await getAgreementTemplateById(id);

  if (!template) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Agreement Template
          </p>
          <h1 className="text-3xl font-bold text-gray-900">{template.title}</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/agreements/templates/${template.id}/edit`}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Edit Template
          </Link>
          <Link
            href="/dashboard/agreements/templates"
            className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back to Templates
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-4 md:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Status
            </p>
            <span
              className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                template.active
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {template.active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Created
              </p>
              <p className="text-sm text-gray-900">{formatDate(template.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Last Updated
              </p>
              <p className="text-sm text-gray-900">{formatDate(template.updatedAt)}</p>
            </div>
          </div>
        </div>
        <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Content</h2>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: template.contentRichtext }} />
        </div>
      </div>
    </div>
  );
}
