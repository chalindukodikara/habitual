import { useMemo } from "react";

interface Habit {
  currentStreak: number;
  longestStreak: number;
  rate30d: number;
}

interface HeatmapEntry {
  date: string;
  count: number;
}

interface AchievementsProps {
  habits: Habit[];
  heatmapData?: HeatmapEntry[];
  totalCompletions?: number;
  perfectDays?: number;
}

interface Badge {
  id: string;
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
  color: string;
}

export default function Achievements({ habits, totalCompletions = 0, perfectDays = 0 }: AchievementsProps) {
  const badges = useMemo<Badge[]>(() => {
    const maxStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.longestStreak)) : 0;
    const maxCurrentStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.currentStreak)) : 0;
    const avgRate = habits.length > 0
      ? habits.reduce((s, h) => s + h.rate30d, 0) / habits.length
      : 0;
    const habitsAbove80 = habits.filter((h) => h.rate30d >= 80).length;

    return [
      {
        id: "first-habit",
        icon: "\uD83C\uDF31",
        name: "First Seed",
        description: "Create your first habit",
        unlocked: habits.length > 0,
        color: "#10b981",
      },
      {
        id: "streak-7",
        icon: "\u2B50",
        name: "Week Warrior",
        description: "Reach a 7-day streak",
        unlocked: maxStreak >= 7,
        color: "#f59e0b",
      },
      {
        id: "streak-30",
        icon: "\uD83D\uDD25",
        name: "Monthly Master",
        description: "Reach a 30-day streak",
        unlocked: maxStreak >= 30,
        color: "#ef4444",
      },
      {
        id: "streak-100",
        icon: "\uD83D\uDC8E",
        name: "Century Club",
        description: "Reach a 100-day streak",
        unlocked: maxStreak >= 100,
        color: "#8b5cf6",
      },
      {
        id: "completions-50",
        icon: "\uD83C\uDFAF",
        name: "Half Century",
        description: "Complete 50 total habits",
        unlocked: totalCompletions >= 50,
        color: "#3b82f6",
      },
      {
        id: "completions-500",
        icon: "\uD83C\uDFC6",
        name: "500 Club",
        description: "Complete 500 total habits",
        unlocked: totalCompletions >= 500,
        color: "#f59e0b",
      },
      {
        id: "perfect-7",
        icon: "\uD83C\uDF1F",
        name: "Perfect Week",
        description: "Have 7 perfect days",
        unlocked: perfectDays >= 7,
        color: "#ec4899",
      },
      {
        id: "perfect-30",
        icon: "\uD83D\uDC51",
        name: "Perfect Month",
        description: "Have 30 perfect days",
        unlocked: perfectDays >= 30,
        color: "#f59e0b",
      },
      {
        id: "consistency-80",
        icon: "\uD83D\uDCAA",
        name: "Consistent",
        description: "Average 80%+ over 30 days",
        unlocked: avgRate >= 80 && habits.length > 0,
        color: "#10b981",
      },
      {
        id: "multi-master",
        icon: "\uD83C\uDF08",
        name: "Multi-Master",
        description: "3+ habits above 80% rate",
        unlocked: habitsAbove80 >= 3,
        color: "#6366f1",
      },
      {
        id: "active-streak",
        icon: "\u26A1",
        name: "Electrified",
        description: "Active 14+ day streak right now",
        unlocked: maxCurrentStreak >= 14,
        color: "#eab308",
      },
      {
        id: "completions-1000",
        icon: "\uD83D\uDE80",
        name: "Rocket",
        description: "Complete 1000 total habits",
        unlocked: totalCompletions >= 1000,
        color: "#ef4444",
      },
    ];
  }, [habits, totalCompletions, perfectDays]);

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="card animate-fade-in-up-delay-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
          <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.704c-.988 0-1.93-.207-2.77-.704" />
          </svg>
          Achievements
        </h2>
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
          {unlockedCount}/{badges.length} unlocked
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`relative rounded-xl p-3 text-center transition-all duration-300 ${
              badge.unlocked
                ? "bg-gradient-to-b from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                : "bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 opacity-40 grayscale"
            }`}
          >
            <div className="text-2xl mb-1">{badge.icon}</div>
            <div className="text-[10px] font-bold text-gray-800 dark:text-gray-200 leading-tight">
              {badge.name}
            </div>
            <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">
              {badge.description}
            </div>
            {badge.unlocked && (
              <div
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-white text-[8px]"
                style={{ backgroundColor: badge.color }}
              >
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
