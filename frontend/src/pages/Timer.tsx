import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const DEFAULT_PROFILE_ID = "11111111-1111-4111-8111-111111111111";

type TimerMode = "stopwatch" | "focus";
type FocusPhase = "work" | "shortBreak" | "longBreak";

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  archived: boolean;
}

interface TimerSession {
  habitId: string;
  habitName: string;
  habitIcon: string;
  duration: number; // ms
  timestamp: number;
  date: string; // YYYY-MM-DD
}

const FOCUS_PRESETS = [
  { label: "Pomodoro", work: 25, short: 5, long: 15 },
  { label: "Short", work: 15, short: 3, long: 10 },
  { label: "Deep Work", work: 50, short: 10, long: 20 },
];

const SESSION_STORAGE_KEY = "habitual-timer-sessions";

function getStoredSessions(): TimerSession[] {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function storeSession(session: TimerSession) {
  const sessions = getStoredSessions();
  sessions.push(session);
  // Keep last 100 sessions
  const trimmed = sessions.slice(-100);
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(trimmed));
}

function getTodaySessions(): TimerSession[] {
  const today = new Date().toISOString().slice(0, 10);
  return getStoredSessions().filter((s) => s.date === today);
}

function formatTime(ms: number, showMs = false): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor((ms % 1000) / 10);

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  if (showMs) {
    return `${pad(minutes)}:${pad(seconds)}.${pad(millis)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMin = minutes % 60;
  return remainingMin > 0 ? `${hours}h ${remainingMin}m` : `${hours}h`;
}

export default function Timer() {
  const [mode, setMode] = useState<TimerMode>("stopwatch");
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/profiles/${DEFAULT_PROFILE_ID}/habits`)
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((data: Habit[]) => setHabits(data.filter((h) => !h.archived)))
      .catch((err) => console.error("Failed to fetch habits:", err));
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center animate-fade-in-up">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Timer</h1>
        <p className="mt-1 text-sm font-medium text-gray-400 dark:text-gray-500">
          {mode === "stopwatch" ? "Track your time" : "Stay focused with Pomodoro"}
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-2xl bg-gray-100 dark:bg-gray-800 p-1 animate-fade-in-up">
        <button
          onClick={() => setMode("stopwatch")}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
            mode === "stopwatch"
              ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Stopwatch
        </button>
        <button
          onClick={() => setMode("focus")}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
            mode === "focus"
              ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Focus Timer
        </button>
      </div>

      {mode === "stopwatch" ? <Stopwatch habits={habits} /> : <FocusTimer habits={habits} />}

      {/* Session History */}
      <SessionHistory />
    </div>
  );
}

function HabitPicker({
  habits,
  selectedHabitId,
  onSelect,
}: {
  habits: Habit[];
  selectedHabitId: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (habits.length === 0) return null;

  return (
    <div className="card !p-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 px-1">
        Link to Habit
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onSelect(null)}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
            selectedHabitId === null
              ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-150 dark:hover:bg-gray-700"
          }`}
        >
          None
        </button>
        {habits.map((habit) => (
          <button
            key={habit.id}
            onClick={() => onSelect(habit.id)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1 ${
              selectedHabitId === habit.id
                ? "text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-150 dark:hover:bg-gray-700"
            }`}
            style={
              selectedHabitId === habit.id
                ? { backgroundColor: habit.color }
                : undefined
            }
          >
            <span className="text-sm">{habit.icon}</span>
            {habit.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function SessionHistory() {
  const [sessions, setSessions] = useState<TimerSession[]>([]);

  useEffect(() => {
    setSessions(getTodaySessions());
  }, []);

  // Group by habit
  const grouped = useMemo(() => {
    const map = new Map<string, { icon: string; name: string; totalMs: number; count: number }>();
    for (const s of sessions) {
      const key = s.habitId || "_none";
      const existing = map.get(key);
      if (existing) {
        existing.totalMs += s.duration;
        existing.count += 1;
      } else {
        map.set(key, {
          icon: s.habitIcon || "---",
          name: s.habitName || "Unlinked",
          totalMs: s.duration,
          count: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalMs - a.totalMs);
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="card !p-5 text-center animate-fade-in-up-delay-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20 mx-auto mb-3">
          <svg className="h-6 w-6 text-blue-400 dark:text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">No sessions yet today</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[220px] mx-auto leading-relaxed">
          Start a stopwatch or focus timer to track your productivity and build momentum.
        </p>
      </div>
    );
  }

  const totalMs = sessions.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="card !p-4 animate-fade-in-up-delay-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
            <svg className="h-4 w-4 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Today's Sessions</span>
        </div>
        <span className="text-sm font-extrabold text-gray-700 dark:text-gray-200">{formatDuration(totalMs)}</span>
      </div>
      <div className="space-y-2">
        {grouped.map((g) => (
          <div key={g.name} className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2">
            <span className="text-lg">{g.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{g.name}</div>
              <div className="text-[11px] text-gray-400 dark:text-gray-500">{g.count} session{g.count !== 1 ? "s" : ""}</div>
            </div>
            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{formatDuration(g.totalMs)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stopwatch({ habits }: { habits: Habit[] }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [linkedHabitId, setLinkedHabitId] = useState<string | null>(null);
  const startTimeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const elapsedRef = useRef(0);

  const tick = useCallback(() => {
    const now = performance.now();
    const newElapsed = elapsedRef.current + (now - startTimeRef.current);
    setElapsed(newElapsed);
    startTimeRef.current = now;
    elapsedRef.current = newElapsed;
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (running) {
      startTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, tick]);

  const handleStartStop = () => {
    if (running) {
      setRunning(false);
    } else {
      setRunning(true);
    }
  };

  const handleLap = () => {
    if (running) {
      setLaps((prev) => [elapsed, ...prev]);
    }
  };

  const handleReset = () => {
    // Save session if there was meaningful elapsed time (> 10 seconds)
    if (elapsedRef.current > 10000) {
      const habit = habits.find((h) => h.id === linkedHabitId);
      storeSession({
        habitId: linkedHabitId || "",
        habitName: habit?.name || "Stopwatch",
        habitIcon: habit?.icon || "---",
        duration: Math.round(elapsedRef.current),
        timestamp: Date.now(),
        date: new Date().toISOString().slice(0, 10),
      });
    }
    setRunning(false);
    setElapsed(0);
    elapsedRef.current = 0;
    setLaps([]);
  };

  return (
    <div className="space-y-6 animate-fade-in-up-delay-1">
      <HabitPicker habits={habits} selectedHabitId={linkedHabitId} onSelect={setLinkedHabitId} />

      {/* Timer Display */}
      <div className="card text-center !py-10">
        <div className="text-6xl font-black tracking-tight text-gray-900 dark:text-white font-mono tabular-nums">
          {formatTime(elapsed, true)}
        </div>
        {laps.length > 0 && (
          <div className="mt-2 text-sm font-medium text-gray-400 dark:text-gray-500">
            Lap {laps.length + 1}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {(elapsed > 0 || running) && (
          <button
            onClick={running ? handleLap : handleReset}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95"
          >
            {running ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
            )}
          </button>
        )}

        <button
          onClick={handleStartStop}
          className={`flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 ${
            running
              ? "bg-red-500 text-white shadow-red-500/30 hover:bg-red-600"
              : "bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-600"
          }`}
        >
          {running ? (
            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="h-8 w-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Laps */}
      {laps.length > 0 && (
        <div className="card !p-3">
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Laps ({laps.length})
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
            {laps.map((lapTime, i) => {
              const lapNumber = laps.length - i;
              const prevLap = i < laps.length - 1 ? laps[i + 1] : 0;
              const lapDuration = lapTime - prevLap;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-2.5 text-sm"
                >
                  <span className="font-medium text-gray-500 dark:text-gray-400">
                    Lap {lapNumber}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                      +{formatTime(lapDuration, true)}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white font-mono tabular-nums">
                      {formatTime(lapTime, true)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FocusTimer({ habits }: { habits: Habit[] }) {
  const [presetIndex, setPresetIndex] = useState(0);
  const [phase, setPhase] = useState<FocusPhase>("work");
  const [timeLeft, setTimeLeft] = useState(FOCUS_PRESETS[0].work * 60 * 1000);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [linkedHabitId, setLinkedHabitId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const workStartRef = useRef<number>(0);

  const preset = FOCUS_PRESETS[presetIndex];
  const totalTime =
    phase === "work"
      ? preset.work * 60 * 1000
      : phase === "shortBreak"
      ? preset.short * 60 * 1000
      : preset.long * 60 * 1000;
  const progress = 1 - timeLeft / totalTime;

  useEffect(() => {
    if (running) {
      if (phase === "work") {
        workStartRef.current = Date.now();
      }
      const start = Date.now();
      const startTimeLeft = timeLeft;
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const remaining = startTimeLeft - elapsed;
        if (remaining <= 0) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          setTimeLeft(0);

          // Save session if work phase completed
          if (phase === "work") {
            const habit = habits.find((h) => h.id === linkedHabitId);
            storeSession({
              habitId: linkedHabitId || "",
              habitName: habit?.name || "Focus Session",
              habitIcon: habit?.icon || "---",
              duration: preset.work * 60 * 1000,
              timestamp: Date.now(),
              date: new Date().toISOString().slice(0, 10),
            });
          }

          // Play a soft notification sound
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            osc.type = "sine";
            gain.gain.value = 0.3;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
            osc.stop(ctx.currentTime + 0.8);
          } catch {
            // Audio not available
          }

          // Auto-advance phase
          if (phase === "work") {
            const newSessions = sessions + 1;
            setSessions(newSessions);
            if (newSessions % 4 === 0) {
              setPhase("longBreak");
              setTimeLeft(preset.long * 60 * 1000);
            } else {
              setPhase("shortBreak");
              setTimeLeft(preset.short * 60 * 1000);
            }
          } else {
            setPhase("work");
            setTimeLeft(preset.work * 60 * 1000);
          }
        } else {
          setTimeLeft(remaining);
        }
      }, 50);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const handleStartStop = () => setRunning(!running);

  const handleReset = () => {
    setRunning(false);
    setPhase("work");
    setTimeLeft(preset.work * 60 * 1000);
    setSessions(0);
  };

  const handlePresetChange = (idx: number) => {
    if (running) return;
    setPresetIndex(idx);
    setPhase("work");
    setTimeLeft(FOCUS_PRESETS[idx].work * 60 * 1000);
    setSessions(0);
  };

  const size = 220;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const phaseColors = {
    work: { stroke: "#10b981", bg: "from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30", label: "Focus", text: "text-emerald-600 dark:text-emerald-400" },
    shortBreak: { stroke: "#06b6d4", bg: "from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30", label: "Short Break", text: "text-cyan-600 dark:text-cyan-400" },
    longBreak: { stroke: "#8b5cf6", bg: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30", label: "Long Break", text: "text-violet-600 dark:text-violet-400" },
  };

  const current = phaseColors[phase];

  return (
    <div className="space-y-6 animate-fade-in-up-delay-1">
      <HabitPicker habits={habits} selectedHabitId={linkedHabitId} onSelect={setLinkedHabitId} />

      {/* Preset Selector */}
      <div className="flex gap-2">
        {FOCUS_PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => handlePresetChange(i)}
            disabled={running}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
              presetIndex === i
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
            }`}
          >
            <div>{p.label}</div>
            <div className="text-[10px] font-normal mt-0.5 opacity-70">{p.work}min</div>
          </button>
        ))}
      </div>

      {/* Phase indicator */}
      <div className={`card !p-4 text-center bg-gradient-to-r ${current.bg} !border-0`}>
        <span className={`text-xs font-bold uppercase tracking-widest ${current.text}`}>
          {current.label}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
          Session {sessions + 1}{phase === "work" ? "" : ` (${phase === "shortBreak" ? "short break" : "long break"})`}
        </span>
      </div>

      {/* Circular Timer */}
      <div className="flex justify-center">
        <div className="relative inline-flex items-center justify-center">
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={current.stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-200"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-5xl font-black tracking-tight text-gray-900 dark:text-white font-mono tabular-nums">
              {formatTime(timeLeft)}
            </span>
            <span className={`text-sm font-semibold mt-1 ${current.text}`}>
              {current.label}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {(running || timeLeft < totalTime) && (
          <button
            onClick={handleReset}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </button>
        )}

        <button
          onClick={handleStartStop}
          className={`flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 ${
            running
              ? "bg-red-500 text-white shadow-red-500/30 hover:bg-red-600"
              : phase === "work"
              ? "bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-600"
              : phase === "shortBreak"
              ? "bg-cyan-500 text-white shadow-cyan-500/30 hover:bg-cyan-600"
              : "bg-violet-500 text-white shadow-violet-500/30 hover:bg-violet-600"
          }`}
        >
          {running ? (
            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="h-8 w-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Session Progress Dots */}
      {sessions > 0 && (
        <div className="card !p-4 text-center">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            Sessions Completed
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {Array.from({ length: sessions }, (_, i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-full ${
                  (i + 1) % 4 === 0
                    ? "bg-violet-500"
                    : "bg-emerald-500"
                }`}
              />
            ))}
          </div>
          <div className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
            {sessions} session{sessions !== 1 ? "s" : ""} &middot; {sessions * preset.work} min focused
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="card !p-4 !bg-gradient-to-r !from-amber-50 !to-orange-50 dark:!from-amber-950/20 dark:!to-orange-950/20 !border-amber-200 dark:!border-amber-800">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-bold text-amber-700 dark:text-amber-300">Pomodoro Technique</div>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70 mt-0.5 leading-relaxed">
              Work for {preset.work} min, take a {preset.short} min break. After 4 sessions, take a {preset.long} min long break.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
