"use client";

interface WeekSelectorProps {
  weeks: string[];
  selectedWeek: string;
  searchValue: string;
  normalizedStatus: string;
}

export function WeekSelector({
  weeks,
  selectedWeek,
  searchValue,
  normalizedStatus,
}: WeekSelectorProps) {
  return (
    <form method="get" className="flex items-center gap-2">
      <label htmlFor="cycleSelect" className="sr-only">
        Select cycle
      </label>
      <select
        id="cycleSelect"
        name="week"
        defaultValue={selectedWeek}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="min-w-[210px] rounded-full border-0 bg-white/15 px-4 py-2 text-sm font-semibold text-white focus:outline-none"
      >
        {weeks.map((week) => (
          <option key={week} value={week} className="text-slate-900">
            Week of {week}
          </option>
        ))}
      </select>
      {searchValue && <input type="hidden" name="search" value={searchValue} />}
      {normalizedStatus && (
        <input type="hidden" name="status" value={normalizedStatus} />
      )}
    </form>
  );
}
