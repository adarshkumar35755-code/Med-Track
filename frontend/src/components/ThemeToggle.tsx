import { useEffect, useState } from "react";
import "./ThemeToggle.css";

const STORAGE_KEY = "amr_theme";

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved === "dark";
    return (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches
    );
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  }, [dark]);

  return (
    <label className="theme-switch">
      <input
        className="theme-switch__input"
        type="checkbox"
        role="switch"
        checked={dark}
        onChange={(e) => setDark(e.target.checked)}
      />
      <span className="theme-switch__sr">Dark Mode</span>
    </label>
  );
}