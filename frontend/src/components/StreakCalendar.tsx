import { useMemo, useState } from "react";

interface HeatmapEntry {
  date: string;
  count: number;
}

interface StreakCalendarProps {
  heatmapData: HeatmapEntry[];
  totalHabits: number;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const DAY_ABBR = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function StreakCalendar({ heatmapData, totalHabits }: StreakCalendarProps) {
  const [monthOffset, setMonthOffset] = useState(0);

  const now = useMemo(() => new Date(), []);

  const { year, month, days, completionMap } = useMemo(() => {
    const target = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const y = target.getFullYear();
    const m = target.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDayOfWeek = new Date(y, m, 1).getDay();

    // Build completion map for this month
    const cMap = new Map<number, number>();
    for (const entry of heatmapData) {
      const d = new Date(entry.date + "T12:00:00");
      if (d.getMonth() === m && d.getFullYear() === y) {
        cMap.set(d.getDate(), entry.count);
      }
    }

    const dayArr: (number | null)[] = [];
    // Add empty cells for alignment
    for (let i = 0; i < firstDayOfWeek; i++) {
      dayArr.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      dayArr.push(d);
    }

    return { year: y, month: m, days: dayArr, completionMap: cMap };
  }, [monthOffset, heatmapData, now]);

  const isToday = (day: number) => {
    return day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
  };

  const isFuture = (day: number) => {
    return new Date(year, month, day) > now;
  };

  const getIntensity = (count: number): string => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-800";
    const ratio = totalHabits > 0 ? count / totalHabits : 0;
    if (ratio >= 1) return "bg-emerald-500 dark:bg-emerald-500";
    if (ratio >= 0.75) return "bg-emerald-400 dark:bg-emerald-600";
    if (ratio >= 0.5) return "bg-emerald-300 dark:bg-emerald-700";
    if (ratio >= 0.25) return "bg-emerald-200 dark:bg-emerald-800";
    return "bg-emerald-100 dark:bg-emerald-900";
  };

  return (
    <div className="card animate-fade-in-up-delay-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
          <svg className="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          Streak Calendar
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthOffset((prev) => Math.min(prev + 1, 11))}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 min-w-[100px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={() => setMonthOffset((prev) => Math.max(prev - 1, 0))}
            disabled={monthOffset === 0}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_ABBR.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-600 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }
          const count = completionMap.get(day) || 0;
          const future = isFuture(day);
          const today = isToday(day);

          return (
            <div
              key={day}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all relative ${
                future
                  ? "text-gray-300 dark:text-gray-700"
                  : count > 0
                  ? `${getIntensity(count)} text-white`
                  : "bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500"
              } ${today ? "ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-gray-900" : ""}`}
              title={future ? "" : `${MONTH_NAMES[month]} ${day}: ${count} habit${count !== 1 ? "s" : ""} completed`}
            >
              {day}
              {count >= totalHabits && totalHabits > 0 && !future && (
                <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-yellow-400 border border-white dark:border-gray-900" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">Less</span>
        <div className="h-3 w-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
        <div className="h-3 w-3 rounded-sm bg-emerald-200 dark:bg-emerald-800" />
        <div className="h-3 w-3 rounded-sm bg-emerald-300 dark:bg-emerald-700" />
        <div className="h-3 w-3 rounded-sm bg-emerald-400 dark:bg-emerald-600" />
        <div className="h-3 w-3 rounded-sm bg-emerald-500 dark:bg-emerald-500" />
        <span className="text-[10px] text-gray-400 dark:text-gray-500">More</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-2 flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-yellow-400" /> Perfect
        </span>
      </div>
    </div>
  );
}
