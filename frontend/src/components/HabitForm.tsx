import { useState } from "react";

interface HabitFormProps {
  onSubmit: (habit: { name: string; icon: string; color: string; frequency: string; description: string }) => void;
  onCancel: () => void;
  initialValues?: { name: string; icon: string; color: string; frequency: string; description: string };
  editMode?: boolean;
}

const GRADIENT_PRESETS = [
  { value: "linear-gradient(135deg, #F97316, #EC4899)", label: "Sunset", from: "#F97316", to: "#EC4899" },
  { value: "linear-gradient(135deg, #06B6D4, #3B82F6)", label: "Ocean", from: "#06B6D4", to: "#3B82F6" },
  { value: "linear-gradient(135deg, #8B5CF6, #EC4899)", label: "Berry", from: "#8B5CF6", to: "#EC4899" },
  { value: "linear-gradient(135deg, #10B981, #06B6D4)", label: "Mint", from: "#10B981", to: "#06B6D4" },
  { value: "linear-gradient(135deg, #F59E0B, #EF4444)", label: "Fire", from: "#F59E0B", to: "#EF4444" },
  { value: "linear-gradient(135deg, #6366F1, #8B5CF6)", label: "Lavender", from: "#6366F1", to: "#8B5CF6" },
  { value: "linear-gradient(135deg, #EC4899, #F43F5E)", label: "Rose", from: "#EC4899", to: "#F43F5E" },
  { value: "linear-gradient(135deg, #14B8A6, #10B981)", label: "Forest", from: "#14B8A6", to: "#10B981" },
];

const PRESET_COLORS = [
  { value: "#EF4444", label: "Red" },
  { value: "#F97316", label: "Orange" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#EAB308", label: "Yellow" },
  { value: "#84CC16", label: "Lime" },
  { value: "#10B981", label: "Emerald" },
  { value: "#14B8A6", label: "Teal" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#0EA5E9", label: "Sky" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#6366F1", label: "Indigo" },
  { value: "#8B5CF6", label: "Violet" },
  { value: "#A855F7", label: "Purple" },
  { value: "#D946EF", label: "Fuchsia" },
  { value: "#EC4899", label: "Pink" },
  { value: "#F43F5E", label: "Rose" },
];

const PRESET_ICONS = [
  { emoji: "\uD83C\uDFC3", label: "Exercise" },
  { emoji: "\uD83D\uDCDA", label: "Read" },
  { emoji: "\uD83E\uDDD8", label: "Meditate" },
  { emoji: "\uD83D\uDCA7", label: "Water" },
  { emoji: "\uD83C\uDF4E", label: "Eat healthy" },
  { emoji: "\uD83D\uDCA4", label: "Sleep" },
  { emoji: "\u270D\uFE0F", label: "Journal" },
  { emoji: "\uD83C\uDFB5", label: "Music" },
  { emoji: "\uD83D\uDCBB", label: "Code" },
  { emoji: "\uD83C\uDF3F", label: "Nature" },
  { emoji: "\uD83D\uDE4F", label: "Gratitude" },
  { emoji: "\uD83E\uDDE0", label: "Learn" },
  { emoji: "\uD83D\uDEBF", label: "Shower" },
  { emoji: "\uD83C\uDF0D", label: "Language" },
  { emoji: "\uD83E\uDD38", label: "Stretch" },
  { emoji: "\uD83D\uDC68\u200D\uD83C\uDF73", label: "Cook" },
  { emoji: "\uD83C\uDFA8", label: "Create" },
  { emoji: "\uD83D\uDEB6", label: "Walk" },
  { emoji: "\uD83C\uDFCB\uFE0F", label: "Weights" },
  { emoji: "\uD83D\uDCF5", label: "No Phone" },
  { emoji: "\uD83D\uDCDD", label: "Write" },
  { emoji: "\uD83C\uDFAF", label: "Focus" },
  { emoji: "\uD83E\uDD64", label: "Smoothie" },
  { emoji: "\uD83D\uDECC", label: "Early Bed" },
  { emoji: "\u2615", label: "Tea" },
  { emoji: "\uD83C\uDFB9", label: "Piano" },
  { emoji: "\uD83D\uDCF7", label: "Photo" },
  { emoji: "\uD83E\uDDFA", label: "Clean" },
  { emoji: "\uD83D\uDE4C", label: "Celebrate" },
  { emoji: "\uD83D\uDCAA", label: "Strength" },
];

export default function HabitForm({ onSubmit, onCancel, initialValues, editMode }: HabitFormProps) {
  const [name, setName] = useState(initialValues?.name || "");
  const [description, setDescription] = useState(initialValues?.description || "");
  const [icon, setIcon] = useState(initialValues?.icon || PRESET_ICONS[0].emoji);
  const [color, setColor] = useState(initialValues?.color || PRESET_COLORS[5].value);
  const [colorMode, setColorMode] = useState<"solid" | "gradient">("solid");
  const [frequency, setFrequency] = useState(initialValues?.frequency || "daily");
  const [nameError, setNameError] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Habit name is required");
      return;
    }
    if (name.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
      return;
    }
    setNameError("");
    onSubmit({ name: name.trim(), icon, color, frequency, description: description.trim() });
  };

  const filteredIcons = iconSearch.trim()
    ? PRESET_ICONS.filter((p) => p.label.toLowerCase().includes(iconSearch.toLowerCase()))
    : PRESET_ICONS;

  return (
    <form onSubmit={handleSubmit} className="card animate-fade-in-up space-y-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
          <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            {editMode ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            )}
          </svg>
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white">{editMode ? "Edit Habit" : "New Habit"}</h3>
      </div>

      {/* Icon and Name row */}
      <div className="flex gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowIconPicker(!showIconPicker)}
            className="flex h-[50px] w-14 items-center justify-center rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-xl transition-all hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          >
            {icon}
          </button>

          {/* Icon picker dropdown */}
          {showIconPicker && (
            <div className="absolute left-0 top-full mt-2 z-20 w-72 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-xl animate-scale-in">
              {/* Search */}
              <input
                type="text"
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 focus:border-emerald-400 focus:outline-none mb-2"
                placeholder="Search icons..."
                autoFocus
              />
              <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto">
                {filteredIcons.map((preset) => (
                  <button
                    key={preset.emoji}
                    type="button"
                    onClick={() => {
                      setIcon(preset.emoji);
                      setShowIconPicker(false);
                      setIconSearch("");
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800 ${
                      icon === preset.emoji ? "bg-emerald-50 dark:bg-emerald-900/30 ring-2 ring-emerald-500" : ""
                    }`}
                    title={preset.label}
                  >
                    {preset.emoji}
                  </button>
                ))}
              </div>
              <div className="mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-center text-sm text-gray-700 dark:text-gray-200 focus:border-emerald-400 focus:outline-none"
                  placeholder="Or type emoji"
                  maxLength={4}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError("");
            }}
            className={`input-field ${nameError ? "!border-red-400 !ring-red-500/10" : ""}`}
            placeholder="Habit name..."
            autoFocus
          />
          {nameError && (
            <p className="mt-1 text-xs font-medium text-red-500">{nameError}</p>
          )}
        </div>
      </div>

      {/* Description field */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Description <span className="normal-case text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-field !py-2 text-sm"
          placeholder="e.g., 30 minutes of cardio"
          maxLength={100}
        />
      </div>

      {/* Color picker */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Color</label>
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
            <button
              type="button"
              onClick={() => setColorMode("solid")}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                colorMode === "solid"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Solid
            </button>
            <button
              type="button"
              onClick={() => setColorMode("gradient")}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                colorMode === "gradient"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Gradient
            </button>
          </div>
        </div>
        {colorMode === "solid" ? (
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`group relative h-8 w-8 rounded-full transition-all duration-200 ${
                  color === c.value && colorMode === "solid"
                    ? "ring-2 ring-offset-2 dark:ring-offset-gray-900 scale-110 shadow-md"
                    : "hover:scale-110 hover:shadow-sm"
                }`}
                style={{
                  backgroundColor: c.value,
                  ['--tw-ring-color' as string]: color === c.value ? c.value : undefined,
                } as React.CSSProperties}
                title={c.label}
              >
                {color === c.value && colorMode === "solid" && (
                  <svg className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {GRADIENT_PRESETS.map((g) => (
              <button
                key={g.label}
                type="button"
                onClick={() => setColor(g.from)}
                className={`group relative h-8 w-16 rounded-full transition-all duration-200 ${
                  color === g.from && colorMode === "gradient"
                    ? "ring-2 ring-offset-2 dark:ring-offset-gray-900 scale-110 shadow-md"
                    : "hover:scale-110 hover:shadow-sm"
                }`}
                style={{
                  background: g.value,
                  ['--tw-ring-color' as string]: color === g.from ? g.from : undefined,
                } as React.CSSProperties}
                title={g.label}
              >
                {color === g.from && colorMode === "gradient" && (
                  <svg className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Frequency toggle */}
      <div>
        <label className="mb-2.5 block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Frequency</label>
        <div className="flex gap-2">
          {[
            { value: "daily", label: "Daily", desc: "Every day" },
            { value: "weekdays", label: "Weekdays", desc: "Mon-Fri" },
            { value: "weekend", label: "Weekend", desc: "Sat-Sun" },
          ].map((freq) => (
            <button
              key={freq.value}
              type="button"
              onClick={() => setFrequency(freq.value)}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                frequency === freq.value
                  ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800 shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-150 hover:text-gray-700 dark:hover:bg-gray-700"
              }`}
            >
              {freq.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-3">
        <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Preview</div>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
            style={{
              backgroundColor: color + "18",
              border: `1.5px solid ${color}30`,
            }}
          >
            {icon}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{name || "Habit name"}</div>
            {description && (
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{description}</div>
            )}
            <div className="text-xs text-gray-400 dark:text-gray-500">{frequency === "daily" ? "Every day" : frequency === "weekdays" ? "Weekdays" : "Weekends"}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary flex-1" disabled={!name.trim()}>
          {editMode ? "Save Changes" : "Create Habit"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
