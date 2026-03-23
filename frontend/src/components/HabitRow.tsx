import { useState, useEffect } from "react";

interface HabitRowProps {
  id: string;
  name: string;
  icon: string;
  color: string;
  currentStreak: number;
  isCompleted: boolean;
  onToggle: (habitId: string) => void;
  disabled?: boolean;
  rate30d?: number;
  description?: string;
}

function StreakBadges({ streak }: { streak: number }) {
  if (streak < 7) return null;

  return (
    <div className="flex items-center gap-1 mt-0.5">
      {streak >= 7 && (
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none
            bg-sky-100 text-sky-700 border border-sky-200
            dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800
            ${streak < 30 ? "animate-pulse-badge" : ""}`}
        >
          7d
        </span>
      )}
      {streak >= 30 && (
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none
            bg-amber-100 text-amber-700 border border-amber-200
            dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800
            ${streak < 100 ? "animate-pulse-badge" : ""}`}
        >
          30d
        </span>
      )}
      {streak >= 100 && (
        <span
          className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none
            bg-purple-100 text-purple-700 border border-purple-200
            dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800
            animate-pulse-badge"
        >
          100d
        </span>
      )}
    </div>
  );
}

export default function HabitRow({
  id,
  name,
  icon,
  color,
  currentStreak,
  isCompleted,
  onToggle,
  disabled,
  rate30d,
  description,
}: HabitRowProps) {
  const [justCompleted, setJustCompleted] = useState(false);
  const [showRipple, setShowRipple] = useState(false);

  useEffect(() => {
    if (isCompleted) {
      setJustCompleted(true);
      setShowRipple(true);
      const timer = setTimeout(() => setJustCompleted(false), 500);
      const rippleTimer = setTimeout(() => setShowRipple(false), 600);
      return () => {
        clearTimeout(timer);
        clearTimeout(rippleTimer);
      };
    }
  }, [isCompleted]);

  return (
    <button
      onClick={() => onToggle(id)}
      disabled={disabled}
      aria-label={`${isCompleted ? "Uncheck" : "Complete"} ${name}${currentStreak > 0 ? `, ${currentStreak} day streak` : ""}`}
      aria-pressed={isCompleted}
      role="checkbox"
      aria-checked={isCompleted}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 active:scale-[0.98] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-1 ${
        justCompleted ? "animate-complete-pop" : ""
      } ${isCompleted ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""}`}
      style={{
        borderLeft: isCompleted ? `3px solid ${color}` : "3px solid transparent",
      }}
    >
      {/* Icon circle */}
      <div
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-lg shadow-sm transition-all duration-300 ${
          isCompleted ? "scale-95 opacity-70" : "hover:scale-105"
        }`}
        style={{
          backgroundColor: color + "18",
          border: `1.5px solid ${color}30`,
        }}
      >
        {icon}
      </div>

      {/* Name and streak */}
      <div className="flex-1 text-left min-w-0">
        <span
          className={`block font-semibold transition-all duration-300 ${
            isCompleted
              ? "text-gray-400 dark:text-gray-500 line-through decoration-gray-300 dark:decoration-gray-600"
              : "text-gray-900 dark:text-white"
          }`}
        >
          {name}
          {rate30d !== undefined && rate30d > 0 && (
            <span
              className={`ml-1.5 inline-block h-2 w-2 rounded-full ${
                rate30d >= 70
                  ? "bg-emerald-500"
                  : rate30d >= 40
                    ? "bg-yellow-400"
                    : "bg-red-400"
              }`}
              title={`30-day rate: ${Math.round(rate30d)}%`}
            />
          )}
        </span>
        {!isCompleted && description && (
          <span className="block text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px]">
            {description}
          </span>
        )}
        {currentStreak > 0 && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-orange-500 dark:text-orange-400 animate-fire">
            <span className="text-sm">&#128293;</span>
            {currentStreak} day streak
            {currentStreak >= 100 && <span className="ml-0.5" title="100+ day streak!">&#128142;</span>}
            {currentStreak >= 30 && currentStreak < 100 && <span className="ml-0.5 animate-pulse" title="30+ day streak!">&#128293;</span>}
            {currentStreak >= 7 && currentStreak < 30 && <span className="ml-0.5" title="7+ day streak!">&#11088;</span>}
          </span>
        )}
        <StreakBadges streak={currentStreak} />
      </div>

      {/* Checkmark circle with ripple */}
      <div className="relative">
        {showRipple && (
          <div
            className="absolute inset-0 rounded-full animate-ripple"
            style={{ backgroundColor: color + "40" }}
          />
        )}
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
            isCompleted
              ? "border-emerald-500 bg-emerald-500 shadow-md shadow-emerald-500/30"
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
          } ${justCompleted ? "animate-ring-burst" : ""}`}
        >
          {isCompleted && (
            <svg
              className="h-4.5 w-4.5 text-white animate-check-bounce"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}
