import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import ProgressRing from "../components/ProgressRing";
import HabitRow from "../components/HabitRow";
import { useToast } from "../contexts/ToastContext";

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

const MOTIVATIONAL_QUOTES = [
  // Discipline & Consistency
  "Small daily improvements lead to stunning results.",
  "Consistency is the mother of mastery.",
  "You don't have to be extreme, just consistent.",
  "The secret of getting ahead is getting started.",
  "Success is the sum of small efforts repeated daily.",
  "Every expert was once a beginner.",
  "Progress, not perfection.",
  "Your habits shape your identity.",
  "One day or day one. You decide.",
  "The only bad workout is the one that didn't happen.",
  "Discipline is choosing between what you want now and what you want most.",
  "It always seems impossible until it's done.",
  // Growth
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Motivation gets you going, but discipline keeps you growing.",
  "Don't watch the clock; do what it does. Keep going.",
  "A year from now you'll wish you had started today.",
  "What you do every day matters more than what you do once in a while.",
  "Excellence is not a singular act, but a habit.",
  "We are what we repeatedly do.",
  "The journey of a thousand miles begins with a single step.",
  // Mindset
  "Fall seven times, stand up eight.",
  "You are never too old to set another goal or dream a new dream.",
  "Believe you can and you're halfway there.",
  "Your only limit is your mind.",
  "The comeback is always stronger than the setback.",
  "Hardships often prepare ordinary people for an extraordinary destiny.",
  "Stay patient and trust your journey.",
  "Great things never come from comfort zones.",
  // Rest & Balance
  "Rest when you need to, but don't quit.",
  "Taking care of yourself is productive.",
  "Almost everything will work again if you unplug it for a few minutes. Including you.",
  "Balance is not something you find, it's something you create.",
  // Focused action
  "Do one thing every day that scares you.",
  "Don't count the days, make the days count.",
  "Action is the foundational key to all success.",
  "Little by little, a little becomes a lot.",
  "Start where you are. Use what you have. Do what you can.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Push yourself, because no one else is going to do it for you.",
  "Dream big. Start small. Act now.",
];

function getDailyQuote(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function DailySummary({ completed, uncompleted }: { completed: Habit[]; uncompleted: Habit[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card !p-4 animate-fade-in-up-delay-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
            <svg className="h-4 w-4 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Daily Summary</span>
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {expanded && (
        <div className="mt-3 space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
          {completed.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 dark:text-emerald-400 mb-1.5">
                Done ({completed.length})
              </div>
              <div className="space-y-1">
                {completed.map((h) => (
                  <div key={h.id} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="text-sm">{h.icon}</span>
                    <span className="line-through">{h.name}</span>
                    {h.currentStreak > 0 && (
                      <span className="text-orange-400 text-[10px] font-semibold ml-auto">&#128293; {h.currentStreak}d</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {uncompleted.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">
                Remaining ({uncompleted.length})
              </div>
              <div className="space-y-1">
                {uncompleted.map((h) => (
                  <div key={h.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <span className="text-sm">{h.icon}</span>
                    <span>{h.name}</span>
                    {h.rate30d < 50 && (
                      <span className="text-red-400 text-[10px] font-semibold ml-auto">needs work</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WeeklyRecap({ habits }: { habits: Habit[] }) {
  const recap = useMemo(() => {
    if (habits.length === 0) return null;

    const streaks = habits.map((h) => h.currentStreak);
    const avgStreak = streaks.reduce((sum, s) => sum + s, 0) / streaks.length;
    const roundedAvg = Math.round(avgStreak);

    const today = new Date().getDay();
    const bestDayIndex = (today + 7 - (Math.max(...streaks) % 7)) % 7;
    const bestDay = DAY_NAMES[bestDayIndex];

    const avgRate = habits.reduce((sum, h) => sum + h.rate30d, 0) / habits.length;

    return { avgStreak: roundedAvg, bestDay, avgRate: Math.round(avgRate) };
  }, [habits]);

  if (!recap) return null;

  return (
    <div className="card !p-4 animate-fade-in-up-delay-1">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
          <svg className="h-4 w-4 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Weekly Recap</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2 text-center">
          <div className="text-lg font-extrabold text-gray-900 dark:text-white">{recap.avgStreak}d</div>
          <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Avg Streak</div>
        </div>
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2 text-center">
          <div className="text-lg font-extrabold text-gray-900 dark:text-white">{recap.bestDay.slice(0, 3)}</div>
          <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Best Day</div>
        </div>
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2 text-center">
          <div className="text-lg font-extrabold text-gray-900 dark:text-white">{recap.avgRate}%</div>
          <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">30d Rate</div>
        </div>
      </div>
    </div>
  );
}

function MiniWidgets({ habits, completions }: { habits: Habit[]; completions: Record<string, boolean> }) {
  const widgets = useMemo(() => {
    if (habits.length === 0) return null;

    const maxStreak = Math.max(...habits.map((h) => h.currentStreak), 0);
    const milestones = [7, 14, 30, 60, 100, 365];
    const nextMilestone = milestones.find((m) => m > maxStreak);
    const daysToMilestone = nextMilestone ? nextMilestone - maxStreak : null;

    const completedToday = habits.filter((h) => completions[h.id]).length;
    const totalToday = habits.length;
    const weekdayPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    // Habit at risk: uncompleted habit with highest current streak (most to lose)
    const uncompleted = habits.filter((h) => !completions[h.id]);
    const atRisk = uncompleted.length > 0
      ? uncompleted.reduce((best, h) => (h.currentStreak > best.currentStreak ? h : best), uncompleted[0])
      : null;

    return { maxStreak, nextMilestone, daysToMilestone, weekdayPct, atRisk };
  }, [habits, completions]);

  if (!widgets) return null;

  return (
    <div className="grid grid-cols-3 gap-2 animate-fade-in-up-delay-1">
      {widgets.daysToMilestone !== null && widgets.nextMilestone ? (
        <div className="card !p-3 text-center card-hover">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/30 mx-auto mb-1">
            <svg className="h-3.5 w-3.5 text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
            </svg>
          </div>
          <div className="text-lg font-black text-violet-600 dark:text-violet-400">{widgets.daysToMilestone}d</div>
          <div className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">to {widgets.nextMilestone}d</div>
        </div>
      ) : (
        <div className="card !p-3 text-center card-hover">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30 mx-auto mb-1">
            <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{widgets.maxStreak}d</div>
          <div className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">Best Streak</div>
        </div>
      )}

      <div className="card !p-3 text-center card-hover">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 mx-auto mb-1">
          <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-lg font-black text-blue-600 dark:text-blue-400">{widgets.weekdayPct}%</div>
        <div className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">Today</div>
      </div>

      {widgets.atRisk && widgets.atRisk.currentStreak > 0 ? (
        <div className="card !p-3 text-center card-hover">
          <div className="text-base mb-0.5">{widgets.atRisk.icon}</div>
          <div className="text-sm font-black text-orange-500 dark:text-orange-400">
            <span className="text-xs">&#128293;</span> {widgets.atRisk.currentStreak}d
          </div>
          <div className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5 truncate px-0.5">At risk!</div>
        </div>
      ) : (
        <div className="card !p-3 text-center card-hover">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30 mx-auto mb-1">
            <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          </div>
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400">New day!</div>
          <div className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">Get started</div>
        </div>
      )}
    </div>
  );
}

function ConfettiDots() {
  const dots = useMemo(() => {
    const colors = [
      "bg-emerald-400", "bg-green-400", "bg-teal-400",
      "bg-yellow-400", "bg-pink-400", "bg-sky-400",
      "bg-violet-400", "bg-orange-400",
    ];
    return Array.from({ length: 16 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      size: i % 4 === 0 ? "h-2.5 w-2.5" : i % 3 === 0 ? "h-2 w-2" : i % 2 === 0 ? "h-1.5 w-1.5" : "h-1 w-1",
      position: {
        top: `${8 + (i * 7) % 84}%`,
        left: `${3 + (i * 11) % 94}%`,
      },
      delay: `${i * 0.15}s`,
    }));
  }, []);

  return (
    <>
      {dots.map((dot) => (
        <div
          key={dot.id}
          className={`absolute rounded-full ${dot.color} ${dot.size} animate-confetti opacity-60`}
          style={{
            top: dot.position.top,
            left: dot.position.left,
            animationDelay: dot.delay,
          }}
        />
      ))}
    </>
  );
}

// Daily challenge generator
function getDailyChallenge(habits: Habit[]): string | null {
  if (habits.length === 0) return null;

  const challenges = [
    "Complete all habits before noon today!",
    "Start with your hardest habit first.",
    "Try completing your habits in reverse order.",
    "Set a personal best streak today!",
    "Complete every habit with full intention.",
    `Focus on ${habits[Math.floor(Date.now() / 86400000) % habits.length]?.name || "your toughest habit"} first.`,
    "No skipping today -- go for 100%!",
  ];

  const dayIndex = Math.floor(Date.now() / 86400000);
  return challenges[dayIndex % challenges.length];
}

export default function Today() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [toggling, setToggling] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState(getGreeting());
  const { showToast } = useToast();

  // Update greeting dynamically
  useEffect(() => {
    const timer = setInterval(() => setGreeting(getGreeting()), 60000);
    return () => clearInterval(timer);
  }, []);

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

      const habitsData: Habit[] = await habitsRes.json();
      const todayData: Record<string, boolean> = await todayRes.json();

      setHabits(habitsData.filter((h) => !h.archived));
      setCompletions(todayData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // In-app encouragement on load
  const encouragementShownRef = useRef(false);
  useEffect(() => {
    if (loading || habits.length === 0 || encouragementShownRef.current) return;
    encouragementShownRef.current = true;

    const milestoneHabit = habits.find((h) =>
      [7, 14, 30, 60, 100].includes(h.currentStreak)
    );
    if (milestoneHabit) {
      const timer = setTimeout(() => {
        showToast(
          `${milestoneHabit.icon} ${milestoneHabit.name} is on a ${milestoneHabit.currentStreak}-day streak!`,
          "success"
        );
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, habits, showToast]);

  const handleToggle = async (habitId: string) => {
    setToggling(habitId);
    const wasCompleted = !!completions[habitId];

    // Optimistic update
    setCompletions((prev) => {
      const updated = { ...prev };
      if (updated[habitId]) {
        delete updated[habitId];
      } else {
        updated[habitId] = true;
      }
      return updated;
    });

    try {
      const res = await fetch(`${API_URL}/api/habits/${habitId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        fetchData();
        showToast("Failed to update habit", "error");
      } else {
        const habit = habits.find((h) => h.id === habitId);
        if (!wasCompleted && habit) {
          showToast(`${habit.icon} ${habit.name} completed!`, "success", {
            label: "Undo",
            onClick: () => handleToggle(habitId),
          });
        }
      }
    } catch {
      fetchData();
      showToast("Failed to update habit", "error");
    } finally {
      setToggling(null);
    }
  };

  const completedCount = habits.filter((h) => completions[h.id]).length;
  const totalCount = habits.length;
  const uncompleted = habits.filter((h) => !completions[h.id]);
  const completed = habits.filter((h) => completions[h.id]);
  const dailyChallenge = useMemo(() => getDailyChallenge(habits), [habits]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton greeting */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-7 w-48 rounded-lg animate-shimmer" />
          <div className="mx-auto h-4 w-32 rounded-lg animate-shimmer" />
        </div>
        {/* Skeleton ring */}
        <div className="flex justify-center">
          <div className="h-[150px] w-[150px] rounded-full animate-shimmer" />
        </div>
        {/* Skeleton habit rows */}
        <div className="card !p-3 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="h-11 w-11 rounded-xl animate-shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 rounded-lg animate-shimmer" />
                <div className="h-3 w-16 rounded-lg animate-shimmer" />
              </div>
              <div className="h-8 w-8 rounded-full animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="text-center animate-fade-in-up">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}
        </h1>
        <p className="mt-1 text-sm font-medium text-gray-400 dark:text-gray-500">{formatToday()}</p>
      </div>

      {/* Quote + Challenge row */}
      <div className={`grid ${dailyChallenge && completedCount < totalCount ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"} gap-3 animate-fade-in-up`}>
        <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-900/50 px-4 py-3 flex items-center gap-3">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-xs">
            &#10077;
          </div>
          <p className="text-xs italic text-emerald-700 dark:text-emerald-300 leading-relaxed line-clamp-2">
            {getDailyQuote()}
          </p>
        </div>
        {dailyChallenge && completedCount < totalCount && (
          <div className="rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border border-violet-100 dark:border-violet-900/50 px-4 py-3 flex items-center gap-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
              <svg className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-violet-500 dark:text-violet-400">Challenge</div>
              <div className="text-xs font-medium text-violet-700 dark:text-violet-300 truncate">{dailyChallenge}</div>
            </div>
          </div>
        )}
      </div>

      {/* Progress + Sidebar layout */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-5 items-start">
        {/* Progress ring */}
        <div className="flex justify-center animate-fade-in-up-delay-1">
          <ProgressRing completed={completedCount} total={totalCount} />
        </div>

        {/* Side cards */}
        <div className="space-y-3">
          {/* Mini Widgets */}
          {habits.length > 0 && <MiniWidgets habits={habits} completions={completions} />}

          {/* Daily Focus — inline in sidebar */}
          {(() => {
            const focusHabit = uncompleted.length > 0 && completedCount < totalCount
              ? [...uncompleted].sort((a, b) => a.rate30d - b.rate30d)[0]
              : null;
            if (!focusHabit) return null;
            return (
              <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2.5 flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: focusHabit.color + "18", borderColor: focusHabit.color + "30" }}
                >
                  {focusHabit.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-amber-500 dark:text-amber-400">Focus</div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{focusHabit.name}</div>
                </div>
                <button
                  onClick={() => handleToggle(focusHabit.id)}
                  disabled={toggling === focusHabit.id}
                  className="flex-shrink-0 rounded-lg bg-amber-500 px-2.5 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-amber-600 active:scale-95 disabled:opacity-50"
                >
                  Do it
                </button>
              </div>
            );
          })()}

          {/* Weekly Recap */}
          {habits.length > 0 && <WeeklyRecap habits={habits} />}
        </div>
      </div>

      {/* Daily Summary — collapsed, below ring section */}
      {habits.length > 0 && completedCount > 0 && completedCount < totalCount && (
        <DailySummary completed={completed} uncompleted={uncompleted} />
      )}

      {/* All done celebration */}
      {completedCount === totalCount && totalCount > 0 && (() => {
        const longestStreakHabit = completed.length > 0
          ? completed.reduce((best, h) => h.currentStreak > best.currentStreak ? h : best, completed[0])
          : null;
        return (
          <div className="card text-center animate-scale-in !bg-gradient-to-br !from-emerald-50 !to-green-50 !border-emerald-200 dark:!from-emerald-950/30 dark:!to-green-950/30 dark:!border-emerald-800 relative overflow-hidden">
            <ConfettiDots />
            <div className="py-6 space-y-3 relative z-10">
              <div className="text-5xl animate-check-bounce">&#127881;</div>
              <h3 className="text-xl font-extrabold text-emerald-800 dark:text-emerald-300">All done for today!</h3>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 max-w-[240px] mx-auto">
                You completed all {totalCount} habits. Keep up the amazing work!
              </p>
              <div className="flex justify-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  100% Complete
                </span>
              </div>
              {longestStreakHabit && longestStreakHabit.currentStreak > 0 && (
                <div className="mt-2 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-emerald-100 dark:border-emerald-800 px-4 py-2.5 inline-flex items-center gap-2 mx-auto">
                  <span className="text-lg">{longestStreakHabit.icon}</span>
                  <div className="text-left">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 dark:text-emerald-400">Longest streak today</div>
                    <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {longestStreakHabit.name} &middot; {longestStreakHabit.currentStreak}d streak
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Habit list */}
      {habits.length === 0 ? (
        <div className="card text-center animate-fade-in-up-delay-2">
          <div className="py-8 space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-3xl">
              &#127793;
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Start your journey</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
              Add your first habit from the Habits tab and start building better routines.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in-up-delay-2">
          {/* Uncompleted habits */}
          {uncompleted.length > 0 && (
            <div className="card !p-2">
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  To do ({uncompleted.length})
                </span>
                <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                  {uncompleted.length} of {totalCount} remaining
                </span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {uncompleted.map((habit) => (
                  <HabitRow
                    key={habit.id}
                    id={habit.id}
                    name={habit.name}
                    icon={habit.icon}
                    color={habit.color}
                    currentStreak={habit.currentStreak}
                    isCompleted={false}
                    onToggle={handleToggle}
                    disabled={toggling === habit.id}
                    rate30d={habit.rate30d}
                    description={habit.description}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed habits */}
          {completed.length > 0 && (
            <div className="card !p-2">
              <div className="px-4 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                  Completed ({completed.length})
                </span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {completed.map((habit) => (
                  <HabitRow
                    key={habit.id}
                    id={habit.id}
                    name={habit.name}
                    icon={habit.icon}
                    color={habit.color}
                    currentStreak={habit.currentStreak}
                    isCompleted={true}
                    onToggle={handleToggle}
                    disabled={toggling === habit.id}
                    rate30d={habit.rate30d}
                    description={habit.description}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
