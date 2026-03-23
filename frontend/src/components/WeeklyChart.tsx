import { useEffect, useState } from "react";

interface WeeklyStat {
  weekStart: string;
  completionRate: number;
}

interface WeeklyChartProps {
  data: WeeklyStat[];
}

export default function WeeklyChart({ data }: WeeklyChartProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-gray-400 dark:text-gray-500">
        <svg className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <p className="text-sm font-medium">No weekly data yet</p>
        <p className="text-xs mt-0.5">Complete some habits to see your trends</p>
      </div>
    );
  }

  const maxRate = Math.max(...data.map((d) => d.completionRate), 100);
  const chartHeight = 160;

  // Calculate trend (compare last 4 weeks average to previous 4 weeks)
  const recentAvg = data.length >= 2
    ? data.slice(-Math.min(4, data.length)).reduce((sum, d) => sum + d.completionRate, 0) / Math.min(4, data.length)
    : 0;
  const previousAvg = data.length >= 5
    ? data.slice(-8, -4).reduce((sum, d) => sum + d.completionRate, 0) / Math.min(4, data.slice(-8, -4).length)
    : recentAvg;
  const trendUp = recentAvg > previousAvg + 2;
  const trendDown = recentAvg < previousAvg - 2;

  return (
    <div className="space-y-3">
      {/* Trend indicator */}
      {data.length >= 4 && (
        <div className="flex items-center gap-2 text-xs font-medium">
          {trendUp && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 text-emerald-600 dark:text-emerald-400 animate-trend-up">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
              Trending up
            </span>
          )}
          {trendDown && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/30 px-2.5 py-1 text-red-500 dark:text-red-400 animate-trend-down">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
              </svg>
              Needs attention
            </span>
          )}
          {!trendUp && !trendDown && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-gray-500 dark:text-gray-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15" />
              </svg>
              Steady
            </span>
          )}
        </div>
      )}

      {/* Vertical bar chart */}
      <div className="relative">
        {/* Horizontal guide lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ height: `${chartHeight}px` }}>
          {[100, 75, 50, 25, 0].map((val) => (
            <div key={val} className="flex items-center">
              <span className="w-7 text-right text-[10px] font-medium text-gray-300 dark:text-gray-600 pr-1.5 -mt-1">{val}</span>
              <div className="flex-1 border-t border-dashed border-gray-100 dark:border-gray-800" />
            </div>
          ))}
        </div>

        <div className="flex items-end justify-between gap-1 pl-8" style={{ height: `${chartHeight}px` }}>
          {data.map((week, i) => {
            const barHeight = animated ? (week.completionRate / maxRate) * chartHeight : 0;
            const barColor =
              week.completionRate >= 70
                ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
                : week.completionRate >= 40
                ? "bg-gradient-to-t from-amber-500 to-amber-300"
                : "bg-gradient-to-t from-red-500 to-red-300";

            return (
              <div
                key={week.weekStart}
                className="group relative flex flex-1 flex-col items-center justify-end"
                style={{ height: "100%" }}
              >
                {/* Tooltip on hover */}
                <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-lg bg-gray-900 dark:bg-gray-700 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                  {week.completionRate.toFixed(0)}%
                  <div className="absolute left-1/2 -bottom-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900 dark:bg-gray-700" />
                </div>
                {/* Bar */}
                <div
                  className={`w-full max-w-[24px] rounded-t-lg ${barColor} shadow-sm`}
                  style={{
                    height: `${barHeight}px`,
                    transitionDelay: `${i * 50}ms`,
                    transition: "height 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    minHeight: week.completionRate > 0 ? "4px" : "0px",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Week labels */}
      <div className="flex justify-between gap-1 pl-8">
        {data.map((week) => {
          const weekDate = new Date(week.weekStart + "T12:00:00");
          const label = weekDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          return (
            <div
              key={week.weekStart}
              className="flex-1 text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 truncate"
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
