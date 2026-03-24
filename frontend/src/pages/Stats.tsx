import { useEffect, useState, useCallback, useMemo } from "react";
import WeeklyChart from "../components/WeeklyChart";
import Sparkline from "../components/Sparkline";

import { getConfig } from "../config";

const API_URL = getConfig().apiUrl;
const DEFAULT_PROFILE_ID = "11111111-1111-4111-8111-111111111111";

interface WeeklyStat {
  weekStart: string;
  completionRate: number;
}

interface HabitRate {
  habitName: string;
  rate30d: number;
  currentStreak: number;
  longestStreak: number;
  color: string;
  icon: string;
}

interface StatsData {
  weeklyStats: WeeklyStat[];
  habitRates: HabitRate[];
}

function getConsistencyGrade(avg: number): { grade: string; color: string; bg: string } {
  if (avg >= 95) return { grade: "A+", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" };
  if (avg >= 85) return { grade: "A", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" };
  if (avg >= 75) return { grade: "B+", color: "text-green-600 dark:text-green-400", bg: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" };
  if (avg >= 65) return { grade: "B", color: "text-lime-600 dark:text-lime-400", bg: "bg-lime-50 border-lime-200 dark:bg-lime-950/30 dark:border-lime-800" };
  if (avg >= 50) return { grade: "C", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" };
  return { grade: "D", color: "text-red-500 dark:text-red-400", bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800" };
}

function getTrendInsight(weeklyStats: WeeklyStat[]): string {
  if (weeklyStats.length < 2) return "Keep going! More data will reveal your trend.";

  const recent = weeklyStats.slice(-Math.min(4, weeklyStats.length));
  const recentAvg = recent.reduce((s, d) => s + d.completionRate, 0) / recent.length;

  if (weeklyStats.length < 5) {
    if (recentAvg >= 70) return "Strong start! You're building momentum.";
    return "Getting started is the hardest part. Stay consistent!";
  }

  const prev = weeklyStats.slice(-8, -4);
  const prevAvg = prev.length > 0
    ? prev.reduce((s, d) => s + d.completionRate, 0) / prev.length
    : recentAvg;

  const diff = recentAvg - prevAvg;

  if (diff > 10) return "You're on fire! Your completion rate is climbing fast.";
  if (diff > 2) return "Nice upward trend! Consistency is paying off.";
  if (diff < -10) return "Looks like a dip recently. Try focusing on your top 2 habits.";
  if (diff < -2) return "Slight slowdown -- a small push will get you back on track.";
  if (recentAvg >= 80) return "Rock-solid consistency. You're in the habit zone!";
  if (recentAvg >= 50) return "Steady progress. Challenge yourself to hit one more habit each day.";
  return "Every completed habit counts. Focus on just one today.";
}

export default function Stats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/profiles/${DEFAULT_PROFILE_ID}/stats`);
      if (!res.ok) {
        console.error("API error:", res.status);
        return;
      }
      const data: StatsData = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Compute derived stats
  const { overallAvg, bestHabit, gradeInfo, habitOfMonth, trendInsight } = useMemo(() => {
    if (!stats || stats.habitRates.length === 0) {
      return {
        overallAvg: 0,
        bestHabit: null as HabitRate | null,
        gradeInfo: getConsistencyGrade(0),
        habitOfMonth: null as HabitRate | null,
        trendInsight: "",
      };
    }

    const avg = stats.habitRates.reduce((sum, h) => sum + h.rate30d, 0) / stats.habitRates.length;
    const best = stats.habitRates.reduce((b, h) => h.rate30d > b.rate30d ? h : b, stats.habitRates[0]);

    // Habit of the month: highest combination of rate + streak
    const hotm = stats.habitRates.reduce((b, h) => {
      const score = h.rate30d * 0.6 + Math.min(h.currentStreak, 30) * 1.33;
      const bestScore = b.rate30d * 0.6 + Math.min(b.currentStreak, 30) * 1.33;
      return score > bestScore ? h : b;
    }, stats.habitRates[0]);

    return {
      overallAvg: avg,
      bestHabit: best,
      gradeInfo: getConsistencyGrade(avg),
      habitOfMonth: hotm,
      trendInsight: getTrendInsight(stats.weeklyStats),
    };
  }, [stats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto h-7 w-32 rounded-lg animate-shimmer" />
          <div className="mx-auto h-4 w-48 rounded-lg animate-shimmer" />
        </div>
        <div className="card">
          <div className="h-5 w-40 rounded-lg animate-shimmer mb-4" />
          <div className="h-[160px] rounded-lg animate-shimmer" />
        </div>
        <div className="card">
          <div className="h-5 w-48 rounded-lg animate-shimmer mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 rounded-lg animate-shimmer" />
                <div className="h-3 w-full rounded-full animate-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center py-20 text-gray-400 dark:text-gray-500">
        <svg className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-sm font-medium">Failed to load stats</p>
        <button onClick={fetchStats} className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center animate-fade-in-up">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistics</h1>
        <p className="mt-1 text-sm font-medium text-gray-400 dark:text-gray-500">Your habit performance over time</p>
      </div>

      {/* Consistency Score Card */}
      {stats.habitRates.length > 0 && (
        <div className={`card !p-5 text-center animate-fade-in-up border ${gradeInfo.bg}`}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Consistency Score</div>
          <div className={`text-6xl font-black ${gradeInfo.color} leading-none`}>
            {gradeInfo.grade}
          </div>
          <div className="mt-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
            {overallAvg.toFixed(0)}% average over 30 days
          </div>
          <div className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
            {overallAvg >= 85
              ? "Elite consistency -- you're in the top tier!"
              : overallAvg >= 65
                ? "Solid performance. Push a bit more for an A!"
                : overallAvg >= 50
                  ? "Building momentum. Keep showing up!"
                  : "Every day is a chance to improve."}
          </div>
        </div>
      )}

      {/* Overview cards */}
      {stats.habitRates.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-fade-in-up-delay-1">
          <div className="card !p-4 text-center card-hover">
            <div className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
              {overallAvg.toFixed(0)}%
            </div>
            <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">30-Day Average</div>
            <p className="text-[10px] italic text-gray-400 dark:text-gray-500 mt-2 leading-snug">
              {overallAvg >= 80
                ? "Outstanding consistency! You're building strong habits."
                : overallAvg >= 60
                  ? "Good progress! A few more consistent days will level you up."
                  : overallAvg >= 40
                    ? "You're getting there! Focus on your top habits first."
                    : "Every day is a fresh start. Try completing just one habit today."}
            </p>
          </div>
          {bestHabit && (
            <div className="card !p-4 text-center card-hover">
              <div className="text-2xl mb-0.5">{bestHabit.icon}</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{bestHabit.habitName}</div>
              <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-0.5 uppercase tracking-wider">Top Performer</div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">{bestHabit.rate30d.toFixed(0)}%</div>
            </div>
          )}
        </div>
      )}

      {/* Habit of the Month spotlight */}
      {habitOfMonth && (
        <div className="card !p-4 animate-fade-in-up-delay-1 !bg-gradient-to-r !from-amber-50 !to-yellow-50 !border-amber-200 dark:!from-amber-950/20 dark:!to-yellow-950/20 dark:!border-amber-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-gray-800 shadow-sm text-2xl border border-amber-100 dark:border-amber-800">
              {habitOfMonth.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500 dark:text-amber-400 mb-0.5">Habit of the Month</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{habitOfMonth.habitName}</div>
              <div className="text-xs text-amber-700 dark:text-amber-400/70 mt-0.5">
                {habitOfMonth.rate30d.toFixed(0)}% completion &middot; {habitOfMonth.currentStreak}d streak
              </div>
            </div>
            <div className="text-3xl">&#127942;</div>
          </div>
        </div>
      )}

      {/* Weekly completion rate */}
      <div className="card animate-fade-in-up-delay-2">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
          <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          Weekly Completion Rate
        </h2>
        <WeeklyChart data={stats.weeklyStats} />
        {/* Motivational insight below chart */}
        {stats.weeklyStats.length > 0 && (
          <div className="mt-4 rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-3 border border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              <span className="font-semibold text-gray-600 dark:text-gray-300">Insight:</span>{" "}
              {trendInsight}
            </p>
          </div>
        )}
      </div>

      {/* Personal Records */}
      {stats.habitRates.length > 0 && (() => {
        const longestStreakHabit = stats.habitRates.reduce((best, h) =>
          h.longestStreak > best.longestStreak ? h : best, stats.habitRates[0]);
        const mostConsistentHabit = stats.habitRates.reduce((best, h) =>
          h.rate30d > best.rate30d ? h : best, stats.habitRates[0]);
        const mostImprovedHabit = stats.habitRates.reduce((best, h) => {
          const hScore = h.rate30d > 0 ? h.currentStreak / (h.rate30d / 100) : 0;
          const bScore = best.rate30d > 0 ? best.currentStreak / (best.rate30d / 100) : 0;
          return hScore > bScore ? h : best;
        }, stats.habitRates[0]);

        const records = [
          {
            label: "Longest Streak",
            habit: longestStreakHabit,
            value: `${longestStreakHabit.longestStreak}d`,
            show: longestStreakHabit.longestStreak > 0,
          },
          {
            label: "Most Consistent",
            habit: mostConsistentHabit,
            value: `${mostConsistentHabit.rate30d.toFixed(0)}%`,
            show: mostConsistentHabit.rate30d > 0,
          },
          {
            label: "Most Improved",
            habit: mostImprovedHabit,
            value: `${mostImprovedHabit.currentStreak}d streak`,
            show: mostImprovedHabit.currentStreak > 0,
          },
        ].filter((r) => r.show);

        if (records.length === 0) return null;

        return (
          <div className="card animate-fade-in-up-delay-2">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
              <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.704c-.988 0-1.93-.207-2.77-.704" />
              </svg>
              Personal Records
            </h2>
            <div className="space-y-3">
              {records.map((record) => (
                <div key={record.label} className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-3 border border-gray-100 dark:border-gray-700">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-base"
                    style={{
                      backgroundColor: record.habit.color + "18",
                      border: `1px solid ${record.habit.color}25`,
                    }}
                  >
                    {record.habit.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{record.label}</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{record.habit.habitName}</div>
                  </div>
                  <div className="text-sm font-extrabold text-gray-700 dark:text-gray-200">{record.value}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Compare Habits */}
      {stats.habitRates.length >= 2 && <ComparisonMode habits={stats.habitRates} />}

      {/* Performance Radar */}
      {stats.habitRates.length >= 3 && <RadarChart habits={stats.habitRates} />}

      {/* Per-habit 30-day rates */}
      <div className="card animate-fade-in-up-delay-3">
        <h2 className="mb-5 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
          <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          30-Day Performance
        </h2>
        <div className="space-y-5">
          {stats.habitRates.map((habit, index) => (
            <HabitRateBar key={habit.habitName} habit={habit} index={index} />
          ))}
          {stats.habitRates.length === 0 && (
            <div className="flex flex-col items-center py-6 text-gray-400 dark:text-gray-500">
              <svg className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">No habit data yet</p>
              <p className="text-xs mt-0.5">Start completing habits to see your stats</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComparisonMode({ habits }: { habits: HabitRate[] }) {
  const [expanded, setExpanded] = useState(false);
  const [habitAName, setHabitAName] = useState<string>("");
  const [habitBName, setHabitBName] = useState<string>("");

  if (habits.length < 2) return null;

  const habitA = habits.find((h) => h.habitName === habitAName);
  const habitB = habits.find((h) => h.habitName === habitBName);

  // Auto-select first two if nothing selected
  const effectiveA = habitA || (!habitAName ? habits[0] : null);
  const effectiveB = habitB || (!habitBName ? habits[1] : null);

  const metrics = effectiveA && effectiveB
    ? [
        { label: "30-Day Rate", aVal: effectiveA.rate30d, bVal: effectiveB.rate30d, suffix: "%" },
        { label: "Current Streak", aVal: effectiveA.currentStreak, bVal: effectiveB.currentStreak, suffix: "d" },
        { label: "Longest Streak", aVal: effectiveA.longestStreak, bVal: effectiveB.longestStreak, suffix: "d" },
      ]
    : [];

  return (
    <div className="card !p-4 animate-fade-in-up-delay-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
            <svg className="h-4 w-4 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Compare Habits</span>
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {expanded && (
        <div className="mt-4 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
          {/* Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1 block">Habit A</label>
              <select
                value={habitAName || (habits[0]?.habitName ?? "")}
                onChange={(e) => setHabitAName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
              >
                {habits.map((h) => (
                  <option key={h.habitName} value={h.habitName}>
                    {h.icon} {h.habitName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1 block">Habit B</label>
              <select
                value={habitBName || (habits[1]?.habitName ?? "")}
                onChange={(e) => setHabitBName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
              >
                {habits.map((h) => (
                  <option key={h.habitName} value={h.habitName}>
                    {h.icon} {h.habitName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison bars */}
          {effectiveA && effectiveB && (
            <div className="space-y-4">
              {/* Header */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-sm"
                    style={{ backgroundColor: effectiveA.color + "18", border: `1px solid ${effectiveA.color}25` }}
                  >
                    {effectiveA.icon}
                  </div>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">{effectiveA.habitName}</span>
                </div>
                <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600">VS</span>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">{effectiveB.habitName}</span>
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-sm"
                    style={{ backgroundColor: effectiveB.color + "18", border: `1px solid ${effectiveB.color}25` }}
                  >
                    {effectiveB.icon}
                  </div>
                </div>
              </div>

              {/* Metrics */}
              {metrics.map((m) => {
                const maxVal = Math.max(m.aVal, m.bVal, 1);
                const aWins = m.aVal > m.bVal;
                const bWins = m.bVal > m.aVal;
                return (
                  <div key={m.label} className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 text-center">{m.label}</div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black min-w-[40px] ${aWins ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`}>
                          {m.aVal.toFixed(m.suffix === "%" ? 0 : 0)}{m.suffix}
                        </span>
                        <div className="flex-1 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(m.aVal / maxVal) * 100}%`,
                              backgroundColor: effectiveA.color,
                              opacity: aWins ? 1 : 0.5,
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-4 flex justify-center">
                        {aWins && (
                          <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                          </svg>
                        )}
                        {bWins && (
                          <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        )}
                        {!aWins && !bWins && <span className="text-[10px] text-gray-400">=</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <span className={`text-sm font-black min-w-[40px] text-right ${bWins ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`}>
                          {m.bVal.toFixed(m.suffix === "%" ? 0 : 0)}{m.suffix}
                        </span>
                        <div className="flex-1 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className="h-full rounded-full transition-all duration-700 ml-auto"
                            style={{
                              width: `${(m.bVal / maxVal) * 100}%`,
                              backgroundColor: effectiveB.color,
                              opacity: bWins ? 1 : 0.5,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RadarChart({ habits }: { habits: HabitRate[] }) {
  if (habits.length < 3) return null;

  const size = 260;
  const center = size / 2;
  const maxR = 95;
  const n = habits.length;
  const levels = [25, 50, 75, 100];

  const getPoint = (index: number, value: number) => {
    const angle = (2 * Math.PI * index) / n - Math.PI / 2;
    const r = (value / 100) * maxR;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const dataPoints = habits.map((h, i) => getPoint(i, h.rate30d));
  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="card animate-fade-in-up-delay-2">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
        <svg className="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
        </svg>
        Performance Radar
      </h2>
      <div className="flex justify-center overflow-hidden">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full">
          {levels.map((pct) => (
            <circle
              key={pct}
              cx={center}
              cy={center}
              r={(pct / 100) * maxR}
              fill="none"
              stroke="currentColor"
              strokeWidth={0.5}
              className="text-gray-200 dark:text-gray-700"
            />
          ))}
          {habits.map((_, i) => {
            const end = getPoint(i, 100);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={end.x}
                y2={end.y}
                stroke="currentColor"
                strokeWidth={0.5}
                className="text-gray-200 dark:text-gray-700"
              />
            );
          })}
          <polygon
            points={polygon}
            fill="rgba(16, 185, 129, 0.15)"
            stroke="#10b981"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {dataPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#10b981" stroke="white" strokeWidth={1.5} className="dark:stroke-gray-900" />
          ))}
          {habits.map((h, i) => {
            const lp = getPoint(i, 130);
            return (
              <text
                key={i}
                x={lp.x}
                y={lp.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[10px] fill-gray-500 dark:fill-gray-400 font-medium"
              >
                {h.icon} {h.rate30d.toFixed(0)}%
              </text>
            );
          })}
        </svg>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
        {habits.map((h) => (
          <div key={h.habitName} className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: h.color }} />
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate max-w-[80px]">{h.habitName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function generateSparklineData(rate: number, streak: number): number[] {
  // Generate a synthetic 7-day trend based on rate and streak
  const data: number[] = [];
  const base = rate / 100;
  for (let i = 0; i < 7; i++) {
    // Simulate improvement trend if streak is active
    const streakBonus = streak > 0 ? Math.min(0.15, (i / 6) * 0.15) : 0;
    const noise = (Math.sin(i * 2.1 + rate) * 0.1);
    data.push(Math.max(0, Math.min(1, base + streakBonus + noise)));
  }
  return data;
}

function HabitRateBar({ habit, index }: { habit: HabitRate; index: number }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200 + index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const getRateColor = (rate: number): string => {
    if (rate >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (rate >= 50) return "text-amber-500 dark:text-amber-400";
    return "text-red-500 dark:text-red-400";
  };

  const getRateBg = (rate: number): string => {
    if (rate >= 80) return "bg-emerald-50 dark:bg-emerald-900/30";
    if (rate >= 50) return "bg-amber-50 dark:bg-amber-900/30";
    return "bg-red-50 dark:bg-red-900/30";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm"
            style={{
              backgroundColor: habit.color + "18",
              border: `1px solid ${habit.color}25`,
            }}
          >
            {habit.icon}
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{habit.habitName}</span>
          <Sparkline
            data={generateSparklineData(habit.rate30d, habit.currentStreak)}
            color={habit.color}
            width={48}
            height={16}
          />
        </div>
        <span className={`text-sm font-extrabold px-2 py-0.5 rounded-lg ${getRateColor(habit.rate30d)} ${getRateBg(habit.rate30d)}`}>
          {habit.rate30d.toFixed(0)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: animated ? `${Math.min(habit.rate30d, 100)}%` : "0%",
            background: `linear-gradient(90deg, ${habit.color}cc, ${habit.color})`,
          }}
        />
      </div>

      {/* Streak info */}
      <div className="flex gap-4 text-xs">
        {habit.currentStreak > 0 && (
          <span className="inline-flex items-center gap-1 text-orange-500 dark:text-orange-400 font-medium">
            <span className="text-xs">&#128293;</span>
            {habit.currentStreak}d streak
          </span>
        )}
        {habit.longestStreak > 0 && (
          <span className="text-gray-400 dark:text-gray-500">
            Best: <span className="font-semibold text-gray-600 dark:text-gray-300">{habit.longestStreak}d</span>
          </span>
        )}
        {habit.rate30d >= 80 && (
          <span className="inline-flex items-center gap-0.5 text-emerald-500 dark:text-emerald-400 font-medium ml-auto">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Excellent
          </span>
        )}
        {habit.rate30d < 30 && habit.rate30d > 0 && (
          <span className="inline-flex items-center gap-0.5 text-red-400 font-medium ml-auto">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
            Needs work
          </span>
        )}
      </div>
    </div>
  );
}
