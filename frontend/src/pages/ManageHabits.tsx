import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import HabitForm from "../components/HabitForm";
import { useToast } from "../contexts/ToastContext";

import { getConfig } from "../config";

const API_URL = getConfig().apiUrl;
const DEFAULT_PROFILE_ID = "11111111-1111-4111-8111-111111111111";

interface Habit {
  id: string;
  profileId: string;
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

const HABIT_TEMPLATES = [
  {
    category: "Morning Routine",
    icon: "\u2600\uFE0F",
    color: "#F59E0B",
    habits: [
      { name: "Morning Stretch", icon: "\uD83E\uDD38", color: "#F59E0B", description: "5 minutes of stretching after waking up" },
      { name: "Drink Water", icon: "\uD83D\uDCA7", color: "#06B6D4", description: "Glass of water right after waking up" },
      { name: "Make Bed", icon: "\uD83D\uDECC", color: "#8B5CF6", description: "Start the day with a small win" },
    ],
  },
  {
    category: "Fitness",
    icon: "\uD83C\uDFCB\uFE0F",
    color: "#EF4444",
    habits: [
      { name: "Exercise", icon: "\uD83C\uDFC3", color: "#EF4444", description: "30 minutes of cardio or strength" },
      { name: "Walk 10k Steps", icon: "\uD83D\uDEB6", color: "#EC4899", description: "Hit 10,000 steps by end of day" },
      { name: "Cold Shower", icon: "\uD83D\uDEBF", color: "#06B6D4", description: "End shower with 30 seconds of cold water" },
    ],
  },
  {
    category: "Mindfulness",
    icon: "\uD83E\uDDD8",
    color: "#8B5CF6",
    habits: [
      { name: "Meditate", icon: "\uD83E\uDDD8", color: "#8B5CF6", description: "10 minutes of mindfulness meditation" },
      { name: "Practice Gratitude", icon: "\uD83D\uDE4F", color: "#A855F7", description: "Write 3 things you're grateful for" },
      { name: "Journal", icon: "\u270D\uFE0F", color: "#6366F1", description: "Write at least one page in your journal" },
    ],
  },
  {
    category: "Productivity",
    icon: "\uD83D\uDE80",
    color: "#3B82F6",
    habits: [
      { name: "No Social Media", icon: "\uD83D\uDCF5", color: "#EF4444", description: "Stay off social media for entire day" },
      { name: "Read 30min", icon: "\uD83D\uDCDA", color: "#3B82F6", description: "Read at least 30 minutes of a book" },
      { name: "Learn a Language", icon: "\uD83C\uDF0D", color: "#6366F1", description: "15 minutes of Duolingo or similar" },
      { name: "No Screen Before Bed", icon: "\uD83D\uDCF5", color: "#F43F5E", description: "No screens 30 minutes before sleep" },
    ],
  },
  {
    category: "Health",
    icon: "\uD83C\uDF4E",
    color: "#10B981",
    habits: [
      { name: "Eat Healthy", icon: "\uD83E\uDD57", color: "#10B981", description: "No junk food, eat whole foods only" },
      { name: "Cook at Home", icon: "\uD83D\uDC68\u200D\uD83C\uDF73", color: "#14B8A6", description: "Prepare at least one meal at home" },
      { name: "Drink 2L Water", icon: "\uD83D\uDCA7", color: "#06B6D4", description: "Drink at least 2 liters throughout day" },
      { name: "Sleep 8hrs", icon: "\uD83D\uDCA4", color: "#6366F1", description: "Get at least 8 hours of sleep" },
    ],
  },
];

function HabitsInsights({ habits }: { habits: Habit[] }) {
  const active = habits.filter((h) => !h.archived);
  if (active.length === 0) return null;

  const avgRate = active.reduce((sum, h) => sum + h.rate30d, 0) / active.length;
  const mostConsistent = active.reduce((best, h) => (h.rate30d > best.rate30d ? h : best), active[0]);
  const leastConsistent = active.reduce((worst, h) => (h.rate30d < worst.rate30d ? h : worst), active[0]);

  return (
    <div className="card !p-4 animate-fade-in-up-delay-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
          <svg className="h-4 w-4 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
          </svg>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Habits Overview</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2 text-center">
          <div className="text-lg font-extrabold text-gray-900 dark:text-white">{active.length}</div>
          <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Active</div>
        </div>
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2 text-center">
          <div className="text-lg font-extrabold text-gray-900 dark:text-white">{avgRate.toFixed(0)}%</div>
          <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Avg Rate</div>
        </div>
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2 text-center">
          <div className="text-lg">{mostConsistent.icon}</div>
          <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Top</div>
        </div>
      </div>
      {leastConsistent.rate30d < 50 && leastConsistent.rate30d > 0 && (
        <div className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 px-3 py-2 flex items-center gap-2">
          <span className="text-sm">{leastConsistent.icon}</span>
          <span className="text-[11px] text-amber-700 dark:text-amber-400">
            <span className="font-semibold">{leastConsistent.name}</span> needs attention ({leastConsistent.rate30d.toFixed(0)}% rate)
          </span>
        </div>
      )}
    </div>
  );
}

export default function ManageHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/profiles/${DEFAULT_PROFILE_ID}/habits`);
      if (!res.ok) {
        console.error("API error:", res.status);
        return;
      }
      const data: Habit[] = await res.json();
      setHabits(data);
    } catch (err) {
      console.error("Failed to fetch habits:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleAddHabit = async (habit: { name: string; icon: string; color: string; frequency: string; description: string }) => {
    try {
      const res = await fetch(`${API_URL}/api/profiles/${DEFAULT_PROFILE_ID}/habits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(habit),
      });

      if (res.ok) {
        setShowForm(false);
        fetchHabits();
        showToast(`${habit.icon} ${habit.name} created!`);
      } else {
        showToast("Failed to create habit", "error");
      }
    } catch (err) {
      console.error("Failed to add habit:", err);
      showToast("Failed to create habit", "error");
    }
  };

  const handleArchive = async (habit: Habit, archived: boolean) => {
    try {
      await fetch(`${API_URL}/api/habits/${habit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });
      fetchHabits();
      showToast(
        archived
          ? `${habit.icon} ${habit.name} archived`
          : `${habit.icon} ${habit.name} restored`
      );
    } catch (err) {
      console.error("Failed to update habit:", err);
      showToast("Failed to update habit", "error");
    }
  };

  const handleDelete = async (habit: Habit) => {
    try {
      const res = await fetch(`${API_URL}/api/habits/${habit.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchHabits();
        showToast(`${habit.icon} ${habit.name} deleted`);
      } else {
        showToast("Failed to delete habit", "error");
      }
    } catch (err) {
      console.error("Failed to delete habit:", err);
      showToast("Failed to delete habit", "error");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleEditHabit = async (updates: { name: string; icon: string; color: string; frequency: string; description: string }) => {
    if (!editingHabit) return;
    try {
      const res = await fetch(`${API_URL}/api/habits/${editingHabit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        setEditingHabit(null);
        fetchHabits();
        showToast(`${updates.icon} ${updates.name} updated!`);
      } else {
        showToast("Failed to update habit", "error");
      }
    } catch {
      showToast("Failed to update habit", "error");
    }
  };

  const handleAddSuggested = (suggestion: { name: string; icon: string; color: string; description: string }) => {
    handleAddHabit({ name: suggestion.name, icon: suggestion.icon, color: suggestion.color, frequency: "daily", description: suggestion.description || "" });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-40 rounded-lg animate-shimmer" />
            <div className="h-4 w-24 rounded-lg animate-shimmer" />
          </div>
          <div className="h-9 w-24 rounded-xl animate-shimmer" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card !p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full animate-shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 rounded-lg animate-shimmer" />
                <div className="h-3 w-40 rounded-lg animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeHabits = habits.filter((h) => !h.archived);
  const archivedHabits = habits.filter((h) => h.archived);
  const existingNames = new Set(habits.map((h) => h.name.toLowerCase()));

  const filteredActive = searchQuery.trim()
    ? activeHabits.filter((h) =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.frequency.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeHabits;

  const filteredArchived = searchQuery.trim()
    ? archivedHabits.filter((h) =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : archivedHabits;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Habits</h1>
          <p className="mt-1 text-sm font-medium text-gray-400 dark:text-gray-500">
            {activeHabits.length} active habit{activeHabits.length !== 1 ? "s" : ""}
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary !py-2.5 !px-4 text-sm gap-1.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Habit
          </button>
        )}
      </div>

      {/* Search bar */}
      {activeHabits.length > 2 && !showForm && (
        <div className="relative animate-fade-in-up">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search habits..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Add habit form */}
      {showForm && (
        <HabitForm onSubmit={handleAddHabit} onCancel={() => setShowForm(false)} />
      )}

      {/* Edit habit form */}
      {editingHabit && (
        <HabitForm
          editMode
          initialValues={{
            name: editingHabit.name,
            icon: editingHabit.icon,
            color: editingHabit.color,
            frequency: editingHabit.frequency,
            description: editingHabit.description || "",
          }}
          onSubmit={handleEditHabit}
          onCancel={() => setEditingHabit(null)}
        />
      )}

      {/* Empty state */}
      {activeHabits.length === 0 && !showForm && (
        <div className="card text-center animate-fade-in-up-delay-1">
          <div className="py-8 space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-3xl animate-float">
              &#127793;
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No habits yet</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
              Create your first habit to start tracking your progress and building consistency.
            </p>
            <button onClick={() => setShowForm(true)} className="btn-primary !py-2.5 !px-5 text-sm mt-2">
              Create your first habit
            </button>
          </div>
        </div>
      )}

      {/* Active habits */}
      {filteredActive.length > 0 && (
        <div className="space-y-2 animate-fade-in-up-delay-1">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Active
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              {filteredActive.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filteredActive.map((habit) => (
            <div key={habit.id} className="card !p-4 flex items-center gap-3 group hover:border-gray-200 dark:hover:border-gray-700 transition-all card-hover">
              <div
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-lg shadow-sm"
                style={{
                  backgroundColor: habit.color + "18",
                  border: `1.5px solid ${habit.color}30`,
                }}
              >
                {habit.icon}
              </div>

              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/habit/${habit.id}`)}>
                <div className="font-semibold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{habit.name}</div>
                {habit.description && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{habit.description}</div>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <span className="inline-flex items-center rounded-lg bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {habit.frequency}
                  </span>
                  {habit.currentStreak > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-orange-500 dark:text-orange-400">
                      <span className="text-sm">&#128293;</span> {habit.currentStreak}d
                    </span>
                  )}
                  {habit.longestStreak > 0 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      Best: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{habit.longestStreak}d</span>
                    </span>
                  )}
                </div>
                {/* 30d rate progress bar */}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="h-1.5 flex-1 max-w-[120px] overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(habit.rate30d, 100)}%`,
                        backgroundColor: habit.color,
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">{habit.rate30d.toFixed(0)}% / 30d</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => { setEditingHabit(habit); setShowForm(false); }}
                  className="rounded-lg p-1.5 text-gray-300 dark:text-gray-600 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-500 dark:hover:text-blue-400"
                  title="Edit habit"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
                <button
                  onClick={() => handleArchive(habit, true)}
                  className="rounded-lg p-1.5 text-gray-300 dark:text-gray-600 transition-all hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-500 dark:hover:text-amber-400"
                  title="Archive habit"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </button>
                {confirmDeleteId === habit.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(habit)}
                      className="rounded-lg p-1.5 text-white bg-red-500 transition-all hover:bg-red-600"
                      title="Confirm delete"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg p-1.5 text-gray-400 bg-gray-100 dark:bg-gray-800 transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
                      title="Cancel"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(habit.id)}
                    className="rounded-lg p-1.5 text-gray-300 dark:text-gray-600 transition-all hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400"
                    title="Delete habit"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Habit Template Packs */}
      <div className="space-y-3 animate-fade-in-up-delay-2">
        <h2 className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          Habit Packs
        </h2>
        <div className="space-y-2">
          {HABIT_TEMPLATES.map((pack) => {
            const availableHabits = pack.habits.filter(
              (h) => !existingNames.has(h.name.toLowerCase())
            );
            if (availableHabits.length === 0) return null;
            const isExpanded = expandedCategory === pack.category;

            return (
              <div key={pack.category} className="card !p-0 overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : pack.category)}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-lg"
                    style={{ backgroundColor: pack.color + "18" }}
                  >
                    {pack.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{pack.category}</div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500">{availableHabits.length} habits available</div>
                  </div>
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2 space-y-1">
                    {availableHabits.map((habit) => (
                      <div
                        key={habit.name}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                      >
                        <div
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm"
                          style={{ backgroundColor: habit.color + "18", border: `1px solid ${habit.color}25` }}
                        >
                          {habit.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{habit.name}</div>
                          <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{habit.description}</div>
                        </div>
                        <button
                          onClick={() => handleAddSuggested(habit)}
                          className="flex-shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Habits Insights */}
      {activeHabits.length > 0 && !showForm && <HabitsInsights habits={habits} />}

      {/* No search results */}
      {searchQuery && filteredActive.length === 0 && filteredArchived.length === 0 && (
        <div className="card text-center animate-fade-in-up py-8">
          <div className="text-2xl mb-2">&#128270;</div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No habits matching &ldquo;{searchQuery}&rdquo;</p>
        </div>
      )}

      {/* Archived habits */}
      {filteredArchived.length > 0 && (
        <div className="space-y-2 animate-fade-in-up-delay-2">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            Archived ({filteredArchived.length})
          </h2>
          {filteredArchived.map((habit) => (
            <div key={habit.id} className="card !p-4 flex items-center gap-3 opacity-50 hover:opacity-70 transition-opacity">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg grayscale"
                style={{ backgroundColor: habit.color + "18" }}
              >
                {habit.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-500 dark:text-gray-400 line-through">{habit.name}</div>
              </div>

              <button
                onClick={() => handleArchive(habit, false)}
                className="rounded-xl p-2 text-gray-400 dark:text-gray-500 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-500 dark:hover:text-emerald-400"
                title="Restore habit"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
