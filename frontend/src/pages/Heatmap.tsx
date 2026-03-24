import { useEffect, useState, useCallback, useMemo } from "react";
import ContributionHeatmap from "../components/ContributionHeatmap";
import Achievements from "../components/Achievements";
import StreakCalendar from "../components/StreakCalendar";

import { getConfig } from "../config";

const API_URL = getConfig().apiUrl;
const DEFAULT_PROFILE_ID = "11111111-1111-4111-8111-111111111111";

interface HeatmapEntry {
  date: string;
  count: number;
}

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  currentStreak: number;
  longestStreak: number;
  rate30d: number;
  archived: boolean;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function RecentActivity({ heatmapData, totalHabits }: { heatmapData: HeatmapEntry[]; totalHabits: number }) {
  const recentDays = useMemo(() => {
    if (heatmapData.length === 0) return [];

    const sorted = [...heatmapData].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-7).map((entry) => {
      const date = new Date(entry.date + "T12:00:00");
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const isToday = entry.date === new Date().toISOString().slice(0, 10);
      const isPerfect = totalHabits > 0 && entry.count >= totalHabits;
      return { ...entry, dayName, dateStr, isToday, isPerfect };
    });
  }, [heatmapData, totalHabits]);

  if (recentDays.length === 0) return null;
  const maxCount = Math.max(...recentDays.map((d) => d.count), 1);

  return (
    <div className="card !p-4 animate-fade-in-up-delay-2">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
          <svg className="h-4 w-4 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Last 7 Days</span>
      </div>
      <div className="space-y-1.5">
        {recentDays.map((day) => (
          <div
            key={day.date}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
              day.isToday ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""
            }`}
          >
            <div className="w-16 flex-shrink-0">
              <div className={`text-xs font-bold ${day.isToday ? "text-emerald-600 dark:text-emerald-400" : "text-gray-700 dark:text-gray-300"}`}>
                {day.isToday ? "Today" : day.dayName}
              </div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500">{day.dateStr}</div>
            </div>
            <div className="flex-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(day.count / maxCount) * 100}%`,
                    backgroundColor: day.isPerfect ? "#10b981" : day.count > 0 ? "#3b82f6" : "#e5e7eb",
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5 w-14 justify-end flex-shrink-0">
              <span
                className={`text-sm font-bold ${
                  day.isPerfect
                    ? "text-emerald-600 dark:text-emerald-400"
                    : day.count > 0
                    ? "text-gray-700 dark:text-gray-200"
                    : "text-gray-300 dark:text-gray-600"
                }`}
              >
                {day.count}
              </span>
              {day.isPerfect && (
                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Heatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [heatmapRes, habitsRes] = await Promise.all([
        fetch(`${API_URL}/api/profiles/${DEFAULT_PROFILE_ID}/heatmap?months=12`),
        fetch(`${API_URL}/api/profiles/${DEFAULT_PROFILE_ID}/habits`),
      ]);

      if (!heatmapRes.ok || !habitsRes.ok) {
        console.error("API error:", heatmapRes.status, habitsRes.status);
        return;
      }

      const heatmap: HeatmapEntry[] = await heatmapRes.json();
      const habitsData: Habit[] = await habitsRes.json();

      setHeatmapData(heatmap);
      setHabits(habitsData.filter((h) => !h.archived));
    } catch (err) {
      console.error("Failed to fetch heatmap data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate stats
  const totalCompletions = heatmapData.reduce((sum, d) => sum + d.count, 0);
  const activeDays = heatmapData.filter((d) => d.count > 0).length;
  const currentMaxStreak = habits.length > 0
    ? Math.max(...habits.map((h) => h.currentStreak))
    : 0;
  const longestMaxStreak = habits.length > 0
    ? Math.max(...habits.map((h) => h.longestStreak))
    : 0;

  // Perfect days: days where count >= number of active habits
  const perfectDays = useMemo(() => {
    if (habits.length === 0) return 0;
    return heatmapData.filter((d) => d.count >= habits.length).length;
  }, [heatmapData, habits]);

  // Daily average: totalCompletions / activeDays
  const dailyAverage = activeDays > 0 ? (totalCompletions / activeDays).toFixed(1) : "0";

  // Best day of the week calculation
  const bestDayInfo = useMemo(() => {
    if (heatmapData.length === 0) return null;

    const dayTotals = [0, 0, 0, 0, 0, 0, 0];
    for (const entry of heatmapData) {
      if (entry.count > 0) {
        const date = new Date(entry.date + "T12:00:00");
        dayTotals[date.getDay()] += entry.count;
      }
    }

    let bestDay = 0;
    for (let i = 1; i < 7; i++) {
      if (dayTotals[i] > dayTotals[bestDay]) bestDay = i;
    }

    if (dayTotals[bestDay] === 0) return null;

    return { name: DAY_NAMES[bestDay], count: dayTotals[bestDay] };
  }, [heatmapData]);

  // This month vs last month comparison
  const monthComparison = useMemo(() => {
    if (heatmapData.length === 0) return null;

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    let thisMonthTotal = 0;
    let lastMonthTotal = 0;

    for (const entry of heatmapData) {
      const date = new Date(entry.date + "T12:00:00");
      const m = date.getMonth();
      const y = date.getFullYear();
      if (m === thisMonth && y === thisYear) {
        thisMonthTotal += entry.count;
      } else if (m === lastMonth && y === lastMonthYear) {
        lastMonthTotal += entry.count;
      }
    }

    const diff = thisMonthTotal - lastMonthTotal;
    const diffPercent = lastMonthTotal > 0 ? Math.round((diff / lastMonthTotal) * 100) : 0;

    return { thisMonth: thisMonthTotal, lastMonth: lastMonthTotal, diff, diffPercent };
  }, [heatmapData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto h-7 w-48 rounded-lg animate-shimmer" />
          <div className="mx-auto h-4 w-56 rounded-lg animate-shimmer" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card !p-4 space-y-2">
              <div className="mx-auto h-8 w-12 rounded-lg animate-shimmer" />
              <div className="mx-auto h-3 w-16 rounded-lg animate-shimmer" />
            </div>
          ))}
        </div>
        <div className="card">
          <div className="h-[140px] rounded-lg animate-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center animate-fade-in-up">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity</h1>
        <p className="mt-1 text-sm font-medium text-gray-400 dark:text-gray-500">Your habit completions over the last 12 months</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 animate-fade-in-up-delay-1">
        <div className="card !p-4 text-center group hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors card-hover">
          <div className="flex items-center justify-center gap-1.5">
            <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
            </svg>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{currentMaxStreak}</div>
          </div>
          <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">Current</div>
        </div>
        <div className="card !p-4 text-center group hover:border-orange-200 dark:hover:border-orange-800 transition-colors card-hover">
          <div className="flex items-center justify-center gap-1.5">
            <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.704c-.988 0-1.93-.207-2.77-.704" />
            </svg>
            <div className="text-2xl font-extrabold text-orange-500">{longestMaxStreak}</div>
          </div>
          <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">Best</div>
        </div>
        <div className="card !p-4 text-center group hover:border-blue-200 dark:hover:border-blue-800 transition-colors card-hover">
          <div className="flex items-center justify-center gap-1.5">
            <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{totalCompletions}</div>
          </div>
          <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">Total</div>
        </div>
        <div className="card !p-4 text-center group hover:border-amber-200 dark:hover:border-amber-800 transition-colors card-hover">
          <div className="flex items-center justify-center gap-1.5">
            <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            <div className="text-2xl font-extrabold text-amber-500">{perfectDays}</div>
          </div>
          <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">Perfect Days</div>
          <div className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">All habits done</div>
        </div>
        <div className="card !p-4 text-center group hover:border-purple-200 dark:hover:border-purple-800 transition-colors card-hover">
          <div className="flex items-center justify-center gap-1.5">
            <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{dailyAverage}</div>
          </div>
          <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">Daily Avg</div>
          <div className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">Habits per active day</div>
        </div>
      </div>

      {/* Best Day & Month Comparison */}
      {(bestDayInfo || monthComparison) && (
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up-delay-1">
          {bestDayInfo && (
            <div className="card !p-4 text-center group hover:border-violet-200 dark:hover:border-violet-800 transition-colors card-hover">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/30 mx-auto mb-1.5">
                <svg className="h-4 w-4 text-violet-500 dark:text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <div className="text-lg font-extrabold text-violet-600 dark:text-violet-400">{bestDayInfo.name.slice(0, 3)}</div>
              <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mt-0.5 uppercase tracking-wider">Best Day</div>
              <div className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">{bestDayInfo.count} completions</div>
            </div>
          )}

          {monthComparison && (
            <div className="card !p-4 text-center group hover:border-cyan-200 dark:hover:border-cyan-800 transition-colors card-hover">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-900/30 mx-auto mb-1.5">
                <svg className="h-4 w-4 text-cyan-500 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-3L16.5 18m0 0L12 13.5m4.5 4.5V6" />
                </svg>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="text-lg font-extrabold text-cyan-600 dark:text-cyan-400">{monthComparison.thisMonth}</span>
                <span className="text-xs text-gray-300 dark:text-gray-600">vs</span>
                <span className="text-sm font-bold text-gray-400 dark:text-gray-500">{monthComparison.lastMonth}</span>
              </div>
              <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mt-0.5 uppercase tracking-wider">This vs Last Month</div>
              {monthComparison.lastMonth > 0 && (
                <div className={`text-[10px] font-semibold mt-1 ${monthComparison.diff >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                  {monthComparison.diff >= 0 ? "+" : ""}{monthComparison.diffPercent}%
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Heatmap */}
      <div className="card animate-fade-in-up-delay-2">
        <ContributionHeatmap data={heatmapData} />
      </div>

      {/* Streak Calendar */}
      {habits.length > 0 && (
        <StreakCalendar
          heatmapData={heatmapData}
          totalHabits={habits.length}
        />
      )}

      {/* Achievements */}
      {habits.length > 0 && (
        <Achievements
          habits={habits}
          heatmapData={heatmapData}
          totalCompletions={totalCompletions}
          perfectDays={perfectDays}
        />
      )}

      {/* Recent Activity */}
      {habits.length > 0 && (
        <RecentActivity heatmapData={heatmapData} totalHabits={habits.length} />
      )}

      {/* Additional stat */}
      {activeDays > 0 && (
        <div className="card !p-4 animate-fade-in-up-delay-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/30">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Active days</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">Days with at least one completion</div>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-green-600 dark:text-green-400">{activeDays}</div>
          </div>
        </div>
      )}
    </div>
  );
}
