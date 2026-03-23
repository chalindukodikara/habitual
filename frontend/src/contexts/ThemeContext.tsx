import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Theme = "light" | "dark" | "auto";

const ACCENT_COLORS = [
  { value: "emerald", label: "Emerald", primary: "#10b981", hover: "#059669" },
  { value: "blue", label: "Blue", primary: "#3b82f6", hover: "#2563eb" },
  { value: "violet", label: "Violet", primary: "#8b5cf6", hover: "#7c3aed" },
  { value: "rose", label: "Rose", primary: "#f43f5e", hover: "#e11d48" },
  { value: "amber", label: "Amber", primary: "#f59e0b", hover: "#d97706" },
  { value: "cyan", label: "Cyan", primary: "#06b6d4", hover: "#0891b2" },
] as const;

type AccentColor = (typeof ACCENT_COLORS)[number]["value"];

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  accentColors: typeof ACCENT_COLORS;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem("habitual-theme") as Theme | null;
      if (saved === "light" || saved === "dark" || saved === "auto") return saved;
    } catch {
      // localStorage not available
    }
    return "light";
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    try {
      const saved = localStorage.getItem("habitual-accent") as AccentColor | null;
      if (saved && ACCENT_COLORS.some((c) => c.value === saved)) return saved;
    } catch {
      // localStorage not available
    }
    return "emerald";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem("habitual-theme", t);
    } catch {
      // localStorage not available
    }
  };

  const setAccentColor = (c: AccentColor) => {
    setAccentColorState(c);
    try {
      localStorage.setItem("habitual-accent", c);
    } catch {
      // localStorage not available
    }
  };

  useEffect(() => {
    const updateResolved = () => {
      if (theme === "auto") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setResolvedTheme(prefersDark ? "dark" : "light");
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolved();

    if (theme === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", updateResolved);
      return () => mq.removeEventListener("change", updateResolved);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  // Apply accent color CSS variables
  useEffect(() => {
    const accent = ACCENT_COLORS.find((c) => c.value === accentColor);
    if (accent) {
      document.documentElement.style.setProperty("--accent-primary", accent.primary);
      document.documentElement.style.setProperty("--accent-hover", accent.hover);
    }
    // Set data attribute for Tailwind-aware accent theming
    document.documentElement.dataset.accent = accentColor;
  }, [accentColor]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, accentColor, setAccentColor, accentColors: ACCENT_COLORS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
