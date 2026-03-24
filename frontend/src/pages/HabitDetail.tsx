import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sparkline from "../components/Sparkline";

import { getConfig } from "../config";

const API_URL = getConfig().apiUrl;
const DEFAULT_PROFILE_ID = "11111111-1111-4111-8111-111111111111";

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: string;
  archived: boolean;
  currentStreak: number;
  longestStreak: number;
  rate30d: number;
  description: string;
}

interface TimerSession {
  habitId: string;
  habitName: string;
  habitIcon: string;
  duration: number;
  timestamp: number;
  date: string;
}

function getStoredSessions(): TimerSession[] {
  try {
    const raw = localStorage.getItem("habitual-timer-sessions");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMin = minutes % 60;
  return remainingMin > 0 ? `${hours}h ${remainingMin}m` : `${hours}h`;
}

function generateSparklineData(rate: number, streak: number): number[] {
  const data: number[] = [];
  const base = rate / 100;
  for (let i = 0; i < 7; i++) {
    const streakBonus = streak > 0 ? Math.min(0.15, (i / 6) * 0.15) : 0;
    const noise = Math.sin(i * 2.1 + rate) * 0.1;
    data.push(Math.max(0, Math.min(1, base + streakBonus + noise)));
  }
  return data;
}

function getRateLabel(rate: number) {
  if (rate >= 90) return { text: "Outstanding", color: "text-emerald-600 dark:text-emerald-400" };
  if (rate >= 75) return { text: "Great", color: "text-green-600 dark:text-green-400" };
  if (rate >= 50) return { text: "Good", color: "text-amber-600 dark:text-amber-400" };
  if (rate >= 25) return { text: "Building", color: "text-orange-500 dark:text-orange-400" };
  return { text: "Starting", color: "text-red-500 dark:text-red-400" };
}

export default function HabitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedToday, setCompletedToday] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [habitsRes, todayRes] = await Promise.all([
        fetch(`${API_URL}/api/profiles/${DEFAULT_PROFILE_ID}/habits`),
        fetch(`${API_URL}/api/profiles/${DEFAULT_PROFILE_ID}/today`),
      ]);
      if (!habitsRes.ok || !todayRes.ok) {
        console.error("API error:", habitsRes.status, todayRes.status);
        return;
      }
      const habits: Habit[] = await habitsRes.json();
      const today: Record<string, boolean> = await todayRes.json();

      const found = habits.find((h) => h.id === id);
      setHabit(found || null);
      if (found) setCompletedToday(!!today[found.id]);
    } catch (err) {
      console.error("Failed to fetch habit:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sessions = useMemo(() => {
    if (!id) return [];
    return getStoredSessions().filter((s) => s.habitId === id);
  }, [id]);

  const totalFocusMs = sessions.reduce((sum, s) => sum + s.duration, 0);
  const todaySessions = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return sessions.filter((s) => s.date === today);
  }, [sessions]);

  // Recent sessions grouped by date (last 7 days)
  const recentSessionsByDate = useMemo(() => {
    const map = new Map<string, { totalMs: number; count: number }>();
    for (const s of sessions) {
      const existing = map.get(s.date);
      if (existing) {
        existing.totalMs += s.duration;
        existing.count += 1;
      } else {
        map.set(s.date, { totalMs: s.duration, count: 1 });
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 7);
  }, [sessions]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg animate-shimmer" />
          <div className="h-6 w-32 rounded-lg animate-shimmer" />
        </div>
        <div className="card !p-6 space-y-4">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-2xl animate-shimmer" />
          </div>
          <div className="h-6 w-40 mx-auto rounded-lg animate-shimmer" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl animate-shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="flex flex-col items-center py-20 text-gray-400 dark:text-gray-500 animate-fade-in-up">
        <svg className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-sm font-medium">Habit not found</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          Go back
        </button>
      </div>
    );
  }

  const rateLabel = getRateLabel(habit.rate30d);

  const ringSize = 140;
  const ringStroke = 8;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference * (1 - habit.rate30d / 100);

  const MILESTONES = [7, 14, 30, 60, 100];

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back
      </button>

      {/* Hero card */}
      <div className="card !p-6 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl text-4xl mx-auto shadow-lg"
          style={{
            backgroundColor: habit.color + "18",
            border: `2px solid ${habit.color}30`,
          }}
        >
          {habit.icon}
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-3">{habit.name}</h1>
        {habit.description && (
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{habit.description}</p>
        )}
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="inline-flex items-center rounded-lg bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {habit.frequency}
          </span>
          {completedToday && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Done today
            </span>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <div className="card !p-3 text-center card-hover">
          <div className="flex items-center justify-center gap-1">
            <span className="text-xs">&#128293;</span>
            <span className="text-xl font-black text-orange-500">{habit.currentStreak}</span>
          </div>
          <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">Current</div>
        </div>
        <div className="card !p-3 text-center card-hover">
          <div className="flex items-center justify-center gap-1">
            <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497" />
            </svg>
            <span className="text-xl font-black text-amber-500">{habit.longestStreak}</span>
          </div>
          <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">Best</div>
        </div>
        <div className="card !p-3 text-center card-hover">
          <span className={`text-xl font-black ${rateLabel.color}`}>{habit.rate30d.toFixed(0)}%</span>
          <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">30d Rate</div>
        </div>
      </div>

      {/* Progress ring + details */}
      <div className="card !p-5">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <svg width={ringSize} height={ringSize} className="-rotate-90">
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth={ringStroke}
                className="text-gray-100 dark:text-gray-800"
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                fill="none"
                stroke={habit.color}
                strokeWidth={ringStroke}
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringDashOffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{habit.rate30d.toFixed(0)}%</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${rateLabel.color}`}>{rateLabel.text}</span>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">7-Day Trend</div>
              <Sparkline
                data={generateSparklineData(habit.rate30d, habit.currentStreak)}
                color={habit.color}
                width={120}
                height={32}
              />
            </div>
            <div className="space-y-1.5">
              {habit.currentStreak > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-orange-500">&#128293;</span>
                  <span className="text-gray-600 dark:text-gray-300">
                    <span className="font-semibold">{habit.currentStreak} day</span> streak active
                  </span>
                </div>
              )}
              {habit.longestStreak > habit.currentStreak && (
                <div className="flex items-center gap-2 text-xs">
                  <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-300">
                    Personal best: <span className="font-semibold">{habit.longestStreak} days</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Streak Milestones */}
      <div className="card !p-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">
          <svg className="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
          </svg>
          Streak Milestones
        </h2>
        <div className="flex gap-2">
          {MILESTONES.map((m) => {
            const reached = habit.longestStreak >= m;
            const current = habit.currentStreak >= m;
            return (
              <div
                key={m}
                className={`flex-1 rounded-xl px-2 py-2.5 text-center border transition-colors ${
                  current
                    ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800"
                    : reached
                    ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    : "bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 opacity-50"
                }`}
              >
                <div
                  className={`text-sm font-black ${
                    current
                      ? "text-emerald-600 dark:text-emerald-400"
                      : reached
                      ? "text-gray-700 dark:text-gray-300"
                      : "text-gray-400 dark:text-gray-600"
                  }`}
                >
                  {m}d
                </div>
                {current && (
                  <svg className="h-3 w-3 text-emerald-500 mx-auto mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
                {reached && !current && (
                  <svg className="h-3 w-3 text-gray-400 mx-auto mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance insight */}
      <div
        className="card !p-4 !border-l-4"
        style={{ borderLeftColor: habit.color }}
      >
        <div className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1">Performance Insight</div>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {habit.rate30d >= 90
            ? `Incredible consistency! You've completed ${habit.name} ${habit.rate30d.toFixed(0)}% of the time over 30 days. This level of dedication puts you in elite territory.`
            : habit.rate30d >= 70
            ? `Strong performance with ${habit.name}! At ${habit.rate30d.toFixed(0)}% completion, you're building a solid habit. A few more consistent days and you'll hit 80%+.`
            : habit.rate30d >= 40
            ? `${habit.name} is a work in progress at ${habit.rate30d.toFixed(0)}%. Try anchoring it to an existing routine — do it right after something you already do daily.`
            : habit.rate30d > 0
            ? `${habit.name} needs some love at ${habit.rate30d.toFixed(0)}%. Start small — even doing it for just 2 minutes counts. Consistency beats intensity.`
            : `You haven't started ${habit.name} yet. Today is the perfect day to begin! Remember: the hardest step is the first one.`}
        </p>
      </div>

      {/* Timer sessions */}
      {sessions.length > 0 && (
        <div className="card !p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">
            <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Focus Sessions
          </h2>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2 text-center">
              <div className="text-lg font-extrabold text-gray-900 dark:text-white">{sessions.length}</div>
              <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total</div>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2 text-center">
              <div className="text-lg font-extrabold text-gray-900 dark:text-white">{formatDuration(totalFocusMs)}</div>
              <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Time</div>
            </div>
          </div>
          {todaySessions.length > 0 && (
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 px-3 py-2 mb-3">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Today: {todaySessions.length} session{todaySessions.length !== 1 ? "s" : ""} &middot; {formatDuration(todaySessions.reduce((s, t) => s + t.duration, 0))}
              </span>
            </div>
          )}
          {recentSessionsByDate.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Recent</div>
              {recentSessionsByDate.map(([date, info]) => {
                const d = new Date(date + "T12:00:00");
                const isToday = date === new Date().toISOString().slice(0, 10);
                return (
                  <div key={date} className="flex items-center justify-between rounded-lg px-3 py-1.5 bg-gray-50 dark:bg-gray-800">
                    <span className={`text-xs font-medium ${isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300"}`}>
                      {isToday ? "Today" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {info.count} session{info.count !== 1 ? "s" : ""} &middot; <span className="font-semibold">{formatDuration(info.totalMs)}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {sessions.length === 0 && (
        <div className="card !p-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 mx-auto mb-2">
            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            No focus sessions yet. Use the Timer tab to track time spent on this habit.
          </p>
        </div>
      )}
    </div>
  );
}
