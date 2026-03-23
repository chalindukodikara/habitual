import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Navigation shortcuts (number keys)
      switch (e.key) {
        case "1":
          navigate("/");
          break;
        case "2":
          navigate("/heatmap");
          break;
        case "3":
          navigate("/timer");
          break;
        case "4":
          navigate("/habits");
          break;
        case "5":
          navigate("/stats");
          break;
        case "?":
          // Show shortcut help (toggle)
          document.dispatchEvent(new CustomEvent("toggle-shortcuts-help"));
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
}
