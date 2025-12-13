import Link from "next/link";

import { WeekSelector } from "@/components/compliance/week-selector";
import { requireRole } from "@/lib/auth-utils";
import {
  getContractorCheckWeeks,
  getContractorChecks,
} from "@/lib/services/compliance.service";

const dayFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const weekTitleFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("en-AU", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Complete", value: "complete" },
  { label: "Pending", value: "pending" },
];

export default async function ContractorChecksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["admin", "manager"]);

  let params: Record<string, string | string[] | undefined> = {};
  try {
    params = (await searchParams) || {};
  } catch (error) {
    console.error("Error parsing search params:", error);
  }

  const weeks = await getContractorCheckWeeks();

  // If still no weeks after auto-generation, show empty state
  if (!weeks || weeks.length === 0) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/compliance"
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Back to Compliance
        </Link>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto max-w-md">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <svg
                className="h-6 w-6 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              No Drivers Found
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Add drivers and assign them vehicles to start tracking contractor
              vehicle checks.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/drivers"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Manage Drivers
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const defaultWeek = weeks[0];
  if (!defaultWeek) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/compliance"
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Back to Compliance
        </Link>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto max-w-md">
            <p className="text-sm text-slate-600">
              Unable to load contractor checks. Please try again.
            </p>
          </div>
        </section>
      </div>
    );
  }

  const requestedWeek =
    typeof params?.week === "string" ? params.week : undefined;
  const selectedWeek =
    requestedWeek && weeks.includes(requestedWeek)
      ? requestedWeek
      : defaultWeek;

  const searchValue =
    typeof params?.search === "string" ? params.search.trim() : "";
  const statusParam = typeof params?.status === "string" ? params.status : "";
  const normalizedStatus =
    statusParam === "pending" || statusParam === "complete" ? statusParam : "";

  const result = await getContractorChecks({
    cycleWeekStart: selectedWeek,
    search: searchValue || undefined,
    status: normalizedStatus || undefined,
  });

  const checks = result?.checks || [];
  const summary = result?.summary || { total: 0, completed: 0, pending: 0 };

  const cycleStart = new Date(`${selectedWeek}T00:00:00`);
  const cycleEnd = endOfWeek(cycleStart);
  const cycleLabel = `Week of ${selectedWeek}`;
  const cycleRangeLabel = `${dayFormatter.format(cycleStart)} – ${dayFormatter.format(cycleEnd)}`;

  const completionRate = summary.total
    ? Math.round((summary.completed / summary.total) * 100)
    : 0;

  const ascendingWeeks = [...weeks].sort((a, b) => (a > b ? 1 : -1));
  const currentWeekIndex = ascendingWeeks.indexOf(selectedWeek);
  const previousWeekKey =
    currentWeekIndex > 0 ? ascendingWeeks[currentWeekIndex - 1]! : null;
  const nextWeekKey =
    currentWeekIndex >= 0 && currentWeekIndex < ascendingWeeks.length - 1
      ? ascendingWeeks[currentWeekIndex + 1]!
      : null;

  const buildQuery = (
    overrides?: Record<string, string | undefined> | null
  ) => {
    const params = new URLSearchParams();

    // Week is always required
    const weekValue = overrides?.week || selectedWeek;
    if (weekValue) {
      params.set("week", weekValue);
    }

    // Search is optional
    const searchOverride = overrides?.search;
    const searchVal =
      searchOverride !== undefined ? searchOverride : searchValue;
    if (searchVal) {
      params.set("search", searchVal);
    }

    // Status is optional
    const statusOverride = overrides?.status;
    const statusVal =
      statusOverride !== undefined ? statusOverride : normalizedStatus;
    if (statusVal) {
      params.set("status", statusVal);
    }

    return `?${params.toString()}`;
  };

  // Calculate initial notification date (Monday + 2 days at 4:00 PM)
  const notificationDate = new Date(cycleStart);
  notificationDate.setDate(notificationDate.getDate() + 2);
  notificationDate.setHours(16, 0, 0, 0);
  const notificationText = `Initial notifications sent ${dayFormatter.format(notificationDate)}, ${timeFormatter.format(notificationDate)}.`;

  return (
    <div className="space-y-8">
      <Link
        href="/dashboard/compliance"
        className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-all hover:text-slate-900"
      >
        <ArrowIcon
          direction="left"
          className="h-4 w-4 transition-transform group-hover:-translate-x-1"
        />
        <span>Back to Compliance</span>
      </Link>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-8 text-white shadow-2xl shadow-blue-500/25">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
        <div className="relative grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">
              Compliance · Contractor vehicle checks
            </p>
            <h1 className="text-4xl font-bold tracking-tight">{cycleLabel}</h1>
            <p className="text-lg font-medium text-white/90">
              {cycleRangeLabel}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <CycleNavLink
                label="Previous"
                targetWeek={previousWeekKey}
                buildQuery={buildQuery}
              />
              <CycleNavLink
                label="Next"
                targetWeek={nextWeekKey}
                buildQuery={buildQuery}
                direction="right"
              />
              <WeekSelector
                weeks={weeks}
                selectedWeek={selectedWeek}
                searchValue={searchValue}
                normalizedStatus={normalizedStatus}
              />
            </div>
          </div>
          <div className="rounded-2xl bg-white/15 p-6 shadow-lg backdrop-blur-sm ring-1 ring-white/20">
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">
              Completion
            </p>
            <p className="mt-3 text-5xl font-bold">{completionRate}%</p>
            <div className="mt-4 h-3 rounded-full bg-white/25 shadow-inner">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-sm transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, completionRate))}%`,
                }}
              />
            </div>
            <p className="mt-2 text-sm text-white/80">
              {summary.completed} of {summary.total} submissions marked complete
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/90">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-4 py-2 font-medium transition-all hover:bg-white/20"
                aria-disabled
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download ZIP
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-4 py-2 font-medium transition-all hover:bg-white/20"
                aria-disabled
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email export
              </button>
            </div>
            <p className="mt-4 text-xs text-white/80">{notificationText}</p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-lg">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/50 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <form method="get" className="w-full max-w-2xl">
            <input type="hidden" name="week" value={selectedWeek} />
            {normalizedStatus && (
              <input type="hidden" name="status" value={normalizedStatus} />
            )}
            <label htmlFor="checksSearchInput" className="sr-only">
              Search driver or vehicle
            </label>
            <div className="flex rounded-full border border-slate-300 bg-white shadow-sm transition-shadow focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
              <span className="flex items-center px-4 text-slate-500">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                id="checksSearchInput"
                name="search"
                type="search"
                className="flex-1 rounded-full border-0 px-3 py-2 text-sm text-slate-700 focus:outline-none"
                placeholder="Search driver, email, phone, or vehicle"
                defaultValue={searchValue}
              />
              <button
                type="submit"
                className="mr-1 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </form>
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_OPTIONS.map((option) => {
              // Build query with explicit status value
              const queryHref = option.value
                ? buildQuery({ status: option.value })
                : buildQuery({ status: "" });

              return (
                <Link
                  key={option.value || "all"}
                  href={queryHref}
                  className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    normalizedStatus === option.value
                      ? "border-2 border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm"
                      : "border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <span>{option.label}</span>
                  <span>·</span>
                  <span className="font-bold">
                    {option.value === "complete"
                      ? summary.completed
                      : option.value === "pending"
                        ? summary.pending
                        : summary.total}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3 text-left">Driver</th>
                <th className="px-6 py-3 text-left">Vehicle</th>
                <th className="px-6 py-3 text-left">Submitted</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {checks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                        <svg
                          className="h-10 w-10 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-base font-medium text-slate-600">
                        No contractor vehicle checks for this cycle
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Checks will appear here once they're generated
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                checks.map((check) => (
                  <tr key={check.id} className="bg-white">
                    <td className="px-6 py-4">
                      <div className="text-base font-semibold text-slate-900">
                        {check.driverName}
                      </div>
                      {check.driverEmail && (
                        <p className="text-xs text-slate-500">
                          {check.driverEmail}
                        </p>
                      )}
                      {check.driverPhone && (
                        <p className="text-xs text-slate-400">
                          {check.driverPhone}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {check.vehicleLabel}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {check.submittedAt ? (
                        <span>
                          {dayFormatter.format(check.submittedAt)} ·{" "}
                          {timeFormatter.format(check.submittedAt)}
                        </span>
                      ) : (
                        <span className="text-amber-600">
                          Awaiting submission
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          check.status === "complete"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {check.status === "complete" ? "Complete" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-2 text-xs">
                        <button
                          type="button"
                          className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Mark complete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CycleNavLink({
  label,
  targetWeek,
  buildQuery,
  direction = "left",
}: {
  label: string;
  targetWeek: string | null;
  buildQuery: (overrides?: Record<string, string | undefined> | null) => string;
  direction?: "left" | "right";
}) {
  if (!targetWeek) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-white/30 px-3 py-1 text-sm font-medium text-white/50">
        {direction === "left" && (
          <ArrowIcon direction="left" className="h-4 w-4" />
        )}
        {label}
        {direction === "right" && (
          <ArrowIcon direction="right" className="h-4 w-4" />
        )}
      </span>
    );
  }

  const queryHref = buildQuery({ week: targetWeek });

  return (
    <Link
      href={queryHref}
      className="inline-flex items-center gap-1 rounded-full border border-white/40 px-3 py-1 text-sm font-medium text-white/90 hover:bg-white/10"
    >
      {direction === "left" && (
        <ArrowIcon direction="left" className="h-4 w-4" />
      )}
      {label}
      {direction === "right" && (
        <ArrowIcon direction="right" className="h-4 w-4" />
      )}
    </Link>
  );
}

function ArrowIcon({
  direction,
  className,
}: {
  direction: "left" | "right";
  className?: string;
}) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      {direction === "left" ? (
        <path
          fillRule="evenodd"
          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414L6.586 10l4.707-4.707a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      ) : (
        <path
          fillRule="evenodd"
          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414L13.414 10l-4.707 4.707a1 1 0 01-1.414 0z"
          clipRule="evenodd"
        />
      )}
    </svg>
  );
}

function endOfWeek(startDate: Date) {
  const result = new Date(startDate);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}
