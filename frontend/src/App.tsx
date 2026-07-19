import { useEffect, useState } from "react";
import IntakeChat from "./components/IntakeChat";
import MythsFacts from "./components/MythsFacts";
import AmrExplainer from "./components/AmrExplainer";
import PrescriptionTracker from "./components/PrescriptionTracker";
import ThemeToggle from "./components/ThemeToggle"; 
import "./App.css";

type Tab = "chat" | "myths" | "amr" | "tracker";
type Theme = "light" | "dark";


const THEME_KEY = "amr_theme";

export default function App() {
  const [tab, setTab] = useState<Tab>("chat");
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <div className="app">
      <header>
        <div className="header-row">
          <div>
              <h1>MED-TRACK</h1>
              <p className="subtitle">
                Understand whether your antibiotic use may be risky — and why it matters
                for antimicrobial resistance.
              </p>
            </div>
            <ThemeToggle />
          </div>
      </header>

      <nav className="tabs">
        <button className={tab === "chat" ? "active" : ""} onClick={() => setTab("chat")}>Chatbot</button>
        <button className={tab === "myths" ? "active" : ""} onClick={() => setTab("myths")}>Myth vs Fact</button>
        <button className={tab === "amr" ? "active" : ""} onClick={() => setTab("amr")}>What is AMR?</button>
        <button className={tab === "tracker" ? "active" : ""} onClick={() => setTab("tracker")}>Prescription Tracker</button>
      </nav>

      <main>
        {tab === "chat" && <IntakeChat />}
        {tab === "myths" && <MythsFacts />}
       
        {tab === "tracker" && <PrescriptionTracker />}
        {tab === "amr" && <AmrExplainer onNavigateToChat={() => setTab("chat")} />}
      </main>

      <footer>
        <p>Educational tool only. Not a substitute for professional medical advice.</p>
        <p>Developed by Two A's</p>
      </footer>
    </div>
  );
}