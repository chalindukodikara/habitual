import { useMemo, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

interface HeatmapEntry {
  date: string;
  count: number;
}

interface ContributionHeatmapProps {
  data: HeatmapEntry[];
}

const COLORS_LIGHT = [
  "#ebedf0",  // Level 0: empty
  "#dcfce7",  // Level 1: lightest green
  "#86efac",  // Level 2: light green
  "#22c55e",  // Level 3: medium green
  "#15803d",  // Level 4: dark green
  "#14532d",  // Level 5: darkest green
];

const COLORS_DARK = [
  "#1e293b",  // Level 0: empty (dark bg)
  "#064e3b",  // Level 1
  "#047857",  // Level 2
  "#059669",  // Level 3
  "#10b981",  // Level 4
  "#34d399",  // Level 5
];

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const CELL_SIZE = 13;
const CELL_GAP = 3;

function getColor(count: number, isDark: boolean): string {
  const colors = isDark ? COLORS_DARK : COLORS_LIGHT;
  if (count === 0) return colors[0];
  if (count === 1) return colors[1];
  if (count === 2) return colors[2];
  if (count === 3) return colors[3];
  if (count === 4) return colors[4];
  return colors[5];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ContributionHeatmap({ data }: ContributionHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { grid, monthLabels } = useMemo(() => {
    // Build a lookup map
    const lookup = new Map<string, number>();
    for (const entry of data) {
      lookup.set(entry.date, entry.count);
    }

    // Calculate date range: last ~52 weeks ending today
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const endDate = new Date(today);

    // Go back ~52 weeks to get start date, aligned to Sunday
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 363); // ~52 weeks
    // Align to the previous Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const weeks: { date: string; count: number; dayOfWeek: number }[][] = [];
    const months: { label: string; weekIndex: number }[] = [];

    let currentDate = new Date(startDate);
    let currentWeek: { date: string; count: number; dayOfWeek: number }[] = [];
    let lastMonth = -1;

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayOfWeek = currentDate.getDay();
      const month = currentDate.getMonth();

      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      if (month !== lastMonth) {
        months.push({
          label: currentDate.toLocaleDateString("en-US", { month: "short" }),
          weekIndex: weeks.length,
        });
        lastMonth = month;
      }

      currentWeek.push({
        date: dateStr,
        count: lookup.get(dateStr) || 0,
        dayOfWeek,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { grid: weeks, monthLabels: months };
  }, [data]);

  const dayLabelWidth = 36;

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-2 heatmap-scroll">
        {/* Month labels */}
        <div className="flex" style={{ paddingLeft: `${dayLabelWidth}px` }}>
          {monthLabels.map((m, i) => {
            const nextWeekIndex = i < monthLabels.length - 1 ? monthLabels[i + 1].weekIndex : grid.length;
            const spanWeeks = nextWeekIndex - m.weekIndex;
            return (
              <div
                key={`${m.label}-${i}`}
                className="text-xs text-gray-500 dark:text-gray-400 font-semibold"
                style={{
                  width: `${spanWeeks * (CELL_SIZE + CELL_GAP)}px`,
                  flexShrink: 0,
                }}
              >
                {spanWeeks >= 2 ? m.label : ""}
              </div>
            );
          })}
        </div>

        {/* Grid with day labels */}
        <div className="flex mt-1.5">
          {/* Day labels column */}
          <div
            className="flex flex-col flex-shrink-0"
            style={{ width: `${dayLabelWidth}px` }}
          >
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="text-[11px] text-gray-500 dark:text-gray-400 font-medium flex items-center"
                style={{ height: `${CELL_SIZE + CELL_GAP}px` }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-[3px]">
            {grid.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }, (_, dayIdx) => {
                  const day = week.find((d) => d.dayOfWeek === dayIdx);
                  if (!day) {
                    return (
                      <div
                        key={dayIdx}
                        style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
                      />
                    );
                  }
                  const cellColor = getColor(day.count, isDark);
                  return (
                    <div
                      key={day.date}
                      className="heatmap-cell rounded-[3px] cursor-pointer"
                      style={{
                        width: `${CELL_SIZE}px`,
                        height: `${CELL_SIZE}px`,
                        backgroundColor: cellColor,
                        outline: day.count > 0 ? `1px solid ${cellColor}40` : "none",
                      }}
                      onMouseEnter={(e) => {
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        const container = (e.target as HTMLElement).closest(".relative")?.getBoundingClientRect();
                        if (container) {
                          setTooltip({
                            x: rect.left - container.left + CELL_SIZE / 2,
                            y: rect.top - container.top - 8,
                            text: day.count === 0
                              ? `No habits on ${formatDate(day.date)}`
                              : `${day.count} habit${day.count !== 1 ? "s" : ""} on ${formatDate(day.date)}`,
                          });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg bg-gray-900 dark:bg-gray-700 px-3 py-2 text-xs font-medium text-white shadow-xl whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          {tooltip.text}
          <div
            className="absolute left-1/2 -bottom-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900 dark:bg-gray-700"
          />
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
        <span>Less</span>
        {(isDark ? COLORS_DARK : COLORS_LIGHT).map((color, i) => {
          const labels = ["0", "1", "2", "3", "4", "5+"];
          return (
            <div key={i} className="group relative">
              <div
                className="rounded-[3px] cursor-help"
                style={{
                  width: `${CELL_SIZE}px`,
                  height: `${CELL_SIZE}px`,
                  backgroundColor: color,
                }}
              />
              <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {labels[i]}
              </div>
            </div>
          );
        })}
        <span>More</span>
      </div>
    </div>
  );
}
