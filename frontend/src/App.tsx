import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { useTheme } from "./contexts/ThemeContext";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import Onboarding from "./components/Onboarding";

const Today = lazy(() => import("./pages/Today"));
const Heatmap = lazy(() => import("./pages/Heatmap"));
const ManageHabits = lazy(() => import("./pages/ManageHabits"));
const Stats = lazy(() => import("./pages/Stats"));
const Timer = lazy(() => import("./pages/Timer"));
const HabitDetail = lazy(() => import("./pages/HabitDetail"));

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const DEFAULT_PROFILE_ID = "11111111-1111-4111-8111-111111111111";

interface HabitSummary {
  currentStreak: number;
  archived: boolean;
}

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop()?.replace(/_/g, " ") || "";

  return (
    <div className="text-right">
      <div className="text-xs font-bold tabular-nums text-gray-700 dark:text-gray-300">
        <span className="animate-clock-tick">{displayHours}:{minutes}</span>
        <span className="text-gray-400 dark:text-gray-500">:{seconds}</span>
        <span className="ml-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500">{period}</span>
      </div>
      <div className="text-[9px] font-medium text-gray-400 dark:text-gray-600">{tz}</div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme, accentColor, setAccentColor, accentColors } = useTheme();
  const [showAccentPicker, setShowAccentPicker] = useState(false);

  const nextTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("auto");
    else setTheme("light");
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* Accent color picker */}
      <div className="relative">
        <button
          onClick={() => setShowAccentPicker(!showAccentPicker)}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 transition-all hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-90"
          title="Accent color"
        >
          <div
            className="h-3.5 w-3.5 rounded-full"
            style={{ backgroundColor: accentColors.find((c) => c.value === accentColor)?.primary }}
          />
        </button>
        {showAccentPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowAccentPicker(false)} />
            <div className="absolute right-0 top-full mt-2 z-50 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-2.5 shadow-xl animate-scale-in">
              <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 px-1">Accent</div>
              <div className="flex gap-1.5">
                {accentColors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      setAccentColor(c.value);
                      setShowAccentPicker(false);
                    }}
                    className={`h-7 w-7 rounded-full transition-all ${
                      accentColor === c.value
                        ? "ring-2 ring-offset-2 dark:ring-offset-gray-900 scale-110"
                        : "hover:scale-110"
                    }`}
                    style={{
                      backgroundColor: c.primary,
                      ['--tw-ring-color' as string]: c.primary,
                    } as React.CSSProperties}
                    title={c.label}
                  >
                    {accentColor === c.value && (
                      <svg className="h-3 w-3 text-white mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Theme toggle */}
      <button
        onClick={nextTheme}
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-90"
        title={`Theme: ${theme}`}
      >
        {theme === "light" && (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        )}
        {theme === "dark" && (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        )}
        {theme === "auto" && (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
          </svg>
        )}
      </button>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    </div>
  );
}

function ShortcutsHelp({ show, onClose }: { show: boolean; onClose: () => void }) {
  if (!show) return null;

  const shortcuts = [
    { key: "1", action: "Go to Today" },
    { key: "2", action: "Go to Activity" },
    { key: "3", action: "Go to Timer" },
    { key: "4", action: "Go to Habits" },
    { key: "5", action: "Go to Stats" },
    { key: "?", action: "Toggle this help" },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="card !p-6 w-72 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Keyboard Shortcuts</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">{s.action}</span>
              <kbd className="rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-mono font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();
  const [pageKey, setPageKey] = useState(location.pathname);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useKeyboardShortcuts();

  useEffect(() => {
    const handler = () => setShowShortcuts((prev) => !prev);
    document.addEventListener("toggle-shortcuts-help", handler);
    return () => document.removeEventListener("toggle-shortcuts-help", handler);
  }, []);

  useEffect(() => {
    setPageKey(location.pathname);
  }, [location.pathname]);

  const fetchStreak = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/profiles/${DEFAULT_PROFILE_ID}/habits`);
      const habits: HabitSummary[] = await res.json();
      const active = habits.filter((h) => !h.archived);
      if (active.length > 0) {
        const maxStreak = Math.max(...active.map((h) => h.currentStreak));
        setDailyStreak(maxStreak);
      }
    } catch {
      // Silently ignore -- header streak is non-critical
    }
  }, []);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak, location.pathname]);

  return (
    <div className="min-h-screen pb-24 transition-colors duration-300 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/80 backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-950/80 transition-colors duration-300">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-green-500 shadow-lg shadow-emerald-500/25">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 007.92 12.446A9 9 0 1112 2.992z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 10v4m0 0l-2-2m2 2l2-2"
                />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Habit<span className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">ual</span>
            </span>
            {dailyStreak > 0 && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[11px] font-bold text-orange-600 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-400">
                <span className="text-xs">&#128293;</span>
                {dailyStreak}d
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LiveClock />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div key={pageKey} className="animate-page-enter">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Today />} />
              <Route path="/heatmap" element={<Heatmap />} />
              <Route path="/habits" element={<ManageHabits />} />
              <Route path="/timer" element={<Timer />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/habit/:id" element={<HabitDetail />} />
            </Routes>
          </Suspense>
        </div>
        {/* Footer */}
        <footer className="mt-12 pb-2 text-center space-y-1">
          <p className="text-[10px] text-gray-300 dark:text-gray-700">
            Built with consistency in mind
          </p>
          <p className="text-[10px] text-gray-300 dark:text-gray-700">
            A demo application for <span className="font-semibold text-gray-400 dark:text-gray-600">OpenChoreo</span>
          </p>
        </footer>
      </main>

      {/* Onboarding */}
      <Onboarding />

      {/* Keyboard Shortcuts Help */}
      <ShortcutsHelp show={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* Quick Actions FAB */}
      <QuickActionsFAB />

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/80 bg-white/95 backdrop-blur-xl safe-bottom dark:border-gray-800/80 dark:bg-gray-950/95 transition-colors duration-300" role="navigation" aria-label="Main navigation">
        <div className="mx-auto flex max-w-4xl items-center justify-around px-2 py-2">
          <TabLink to="/" label="Today" icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          } />
          <TabLink to="/heatmap" label="Activity" icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          } />
          <TabLink to="/timer" label="Timer" icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          } />
          <TabLink to="/habits" label="Habits" icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          } />
          <TabLink to="/stats" label="Stats" icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          } />
        </div>
      </nav>
    </div>
  );
}

function QuickActionsFAB() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  if (location.pathname === "/habits" || location.pathname === "/timer") return null;

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} />}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col-reverse items-end gap-2 safe-bottom">
        {open && (
          <div className="flex flex-col gap-2 animate-scale-in mb-2">
            <NavLink
              to="/habits"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl bg-white dark:bg-gray-800 pl-3 pr-4 py-2.5 shadow-lg border border-gray-100 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              New Habit
            </NavLink>
            <NavLink
              to="/timer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl bg-white dark:bg-gray-800 pl-3 pr-4 py-2.5 shadow-lg border border-gray-100 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Start Timer
            </NavLink>
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 active:scale-95 ${
            open
              ? "bg-gray-600 dark:bg-gray-500 shadow-gray-600/30"
              : "bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/30 hover:shadow-emerald-500/50"
          }`}
        >
          <svg
            className={`h-6 w-6 text-white transition-transform duration-200 ${open ? "rotate-45" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
    </>
  );
}

function TabLink({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
          isActive
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>
            {icon}
          </div>
          <span className={`text-[10px] font-semibold ${isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{label}</span>
          {isActive && (
            <div className="h-0.5 w-4 rounded-full bg-emerald-500 mt-0.5" />
          )}
        </>
      )}
    </NavLink>
  );
}

export default App;
