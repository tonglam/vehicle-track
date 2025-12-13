import Link from "next/link";

import { requireAuth } from "@/lib/auth-utils";
import { getComplianceDashboardData } from "@/lib/services/compliance.service";

const numberFormatter = new Intl.NumberFormat("en-AU");
const rangeFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function CompliancePage() {
  const { user } = await requireAuth();
  const isManager = user.roleName === "admin" || user.roleName === "manager";

  const startDate = startOfWeek(new Date());
  const endDate = endOfWeek(startDate);
  const { metrics } = await getComplianceDashboardData({
    startDate,
    endDate,
  });

  const rangeLabel = `${formatRangeDate(startDate)} – ${formatRangeDate(endDate)}`;

  const summaryCards = [
    {
      label: "Open contractor checks",
      value: formatNumber(metrics.openChecks),
      helper: `${formatNumber(metrics.totalChecks)} scheduled for this cycle`,
    },
    {
      label: "Completion rate",
      value: `${metrics.completionRate}%`,
      helper:
        metrics.totalChecks > 0
          ? `${formatNumber(metrics.completedChecks)} marked complete`
          : "Waiting for first submissions",
    },
    {
      label: "Pending submissions",
      value: formatNumber(metrics.pendingSubmissions),
      helper: `${formatNumber(metrics.pendingSubmissions)} drivers yet to upload`,
    },
  ];

  const highlights = [
    "Weekly compliance checklist sent automatically to assigned contractors.",
    "Reminders keep submissions flowing without manual follow-up.",
    "Managers can review, mark complete, and export results in seconds.",
  ];

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Compliance
          </p>
          <h1 className="text-3xl font-bold text-gray-900">
            Compliance Management
          </h1>
          <p className="mt-2 max-w-3xl text-gray-600">
            A weekly workflow that keeps your contractor vehicle checks on
            schedule. Track every submission, stay on top of pending reviews,
            and open the full contractor workspace when it&rsquo;s time to take
            action.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-600">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {card.value}
            </p>
            <p className="mt-1 text-sm text-gray-500">{card.helper}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Primary workflow
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            Contractor Vehicle Checks
          </h2>
          <p className="mt-3 text-gray-600">
          A weekly checklist sent to assigned drivers to stay compliant with
          regulatory vehicle checks. Track completion, send reminders, and keep
          audit trails tidy.
          </p>

          <ul className="mt-5 space-y-3 text-sm text-gray-600">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 text-emerald-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12l4 4L19 7" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              Managers can enter the workspace to review submissions in depth.
            </div>
            {isManager ? (
              <Link
                href="/dashboard/compliance/contractor-checks"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Enter workspace
              </Link>
            ) : (
              <span className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-500">
                Read-only access · manager required
              </span>
            )}
          </div>
      </section>
    </div>
  );
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfWeek(startDate: Date) {
  const result = new Date(startDate);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

function formatRangeDate(date: Date) {
  return rangeFormatter.format(date);
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}
