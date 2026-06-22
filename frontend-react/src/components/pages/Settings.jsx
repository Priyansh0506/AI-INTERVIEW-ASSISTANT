import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "../../config/api";
import Sidebar from "../layouts/Sidebar";

const DEFAULT_SETTINGS = {
  numQuestions: 1,
  timerSeconds: 90,
  warningThreshold: 3,
  faceTimeoutSeconds: 5,
  theme: "dark",
};

function Settings({ setActivePage, activePage = "settings", theme: propTheme, onThemeChange, user, onLogout }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("interviewSettings");
    if (stored) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }
  }, []);

  function updateSetting(key, value) {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem("interviewSettings", JSON.stringify(updated));
    if (key === "theme" && onThemeChange) onThemeChange(value);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function clearHistory() {
    if (!window.confirm("This will permanently delete all your interview history. Are you sure?")) return;
    setClearing(true);
    try {
      const res = await apiFetch("/clear-history", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      localStorage.removeItem("interviewHistory");
      alert("All history has been cleared.");
    } catch {
      localStorage.removeItem("interviewHistory");
      alert("Local history cleared.");
    } finally {
      setClearing(false);
    }
  }

  const isDark = (propTheme ?? settings.theme) === "dark";

  const colors = {
    bg: isDark ? "#0f0f0f" : "#F7F5F2",
    sidebar: isDark ? "#141414" : "#1C1C1E",
    sidebarBorder: isDark ? "#2a2a2a" : "#2a2a2a",
    card: isDark ? "#1a1a1a" : "#FFFFFF",
    cardBorder: isDark ? "#2a2a2a" : "#E8E4DE",
    text: isDark ? "#F0EDE8" : "#1C1C1E",
    subtext: isDark ? "#8A8580" : "#6B6560",
    label: isDark ? "#6B6560" : "#9B9590",
    accent: "#D97757",
    accentSoft: isDark ? "rgba(217,119,87,0.12)" : "rgba(217,119,87,0.08)",
    accentBorder: "rgba(217,119,87,0.3)",
    optBg: isDark ? "#222222" : "#FAFAF8",
    optBorder: isDark ? "#333333" : "#E0DBD5",
    mutedText: isDark ? "#5A5550" : "#B0AAA4",
  };

  function OptionBtn({ label, active, onClick }) {
    return (
      <button
        onClick={onClick}
        style={{
          padding: "9px 18px",
          borderRadius: 8,
          border: active ? `1.5px solid ${colors.accent}` : `1px solid ${colors.optBorder}`,
          background: active ? colors.accentSoft : colors.optBg,
          color: active ? colors.accent : colors.subtext,
          fontSize: "0.88rem",
          fontWeight: active ? 600 : 400,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = colors.accent; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = colors.optBorder; }}
      >
        {label}
      </button>
    );
  }

  function SettingCard({ title, description, children, danger }) {
    return (
      <div style={{
        background: danger
          ? isDark ? "rgba(192,100,90,0.06)" : "#FDF5F4"
          : colors.card,
        borderRadius: 14,
        padding: "20px 24px",
        border: danger
          ? `1px solid rgba(192,100,90,0.25)`
          : `1px solid ${colors.cardBorder}`,
        boxShadow: isDark ? "none" : "0 2px 10px rgba(0,0,0,0.04)",
      }}>
        <div style={{ fontSize: "0.92rem", fontWeight: 600, color: danger ? "#C0645A" : colors.text, marginBottom: 3 }}>
          {title}
        </div>
        <div style={{ fontSize: "0.82rem", color: colors.subtext, marginBottom: 14 }}>
          {description}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", height: "100vh", width: "100vw", overflow: "hidden",
      background: colors.bg,
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .nav-btn { transition: all 0.18s ease; }
        .nav-btn:hover { background: ${isDark ? "#222" : "#F0EDE8"} !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${colors.cardBorder}; border-radius: 10px; }
      `}</style>

     <Sidebar
  setActivePage={setActivePage}
  activePage={activePage}
  theme={propTheme ?? settings.theme}
  user={user}
  onLogout={onLogout}
  onNewInterview={() => setActivePage("dashboard")}
/>

      {/* Main */}
      <div style={{ flex: 1, padding: "40px 48px", overflowY: "auto" }}>

        {/* Header */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
        >
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: colors.text, margin: 0, letterSpacing: "-0.4px" }}>
              Settings
            </h1>
            <p style={{ color: colors.subtext, fontSize: "0.9rem", margin: "6px 0 0" }}>
              Adjust how your interviews work
            </p>
          </div>

          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  background: isDark ? "rgba(106,158,106,0.12)" : "#F0F7F0",
                  color: "#6A9E6A",
                  border: "1px solid rgba(106,158,106,0.25)",
                  padding: "7px 14px", borderRadius: 8,
                  fontSize: "0.82rem", fontWeight: 600,
                }}
              >
                Saved
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 660 }}
        >

          {/* Number of questions */}
          <SettingCard
            title="Number of questions"
            description="How many questions you'll be asked per session"
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[1, 3, 5, 10].map(n => (
                <OptionBtn
                  key={n}
                  label={String(n)}
                  active={settings.numQuestions === n}
                  onClick={() => updateSetting("numQuestions", n)}
                />
              ))}
            </div>
          </SettingCard>

          {/* Time per question */}
          <SettingCard
            title="Time per question"
            description="How long you get to answer each question"
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { label: "30s", value: 30 },
                { label: "1 min", value: 60 },
                { label: "90s", value: 90 },
                { label: "2 min", value: 120 },
                { label: "5 min", value: 300 },
              ].map(opt => (
                <OptionBtn
                  key={opt.value}
                  label={opt.label}
                  active={settings.timerSeconds === opt.value}
                  onClick={() => updateSetting("timerSeconds", opt.value)}
                />
              ))}
            </div>
          </SettingCard>

          {/* Warning threshold */}
          <SettingCard
            title="Warning limit"
            description="Interview ends automatically after this many warnings"
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[1, 2, 3, 5].map(n => (
                <OptionBtn
                  key={n}
                  label={String(n)}
                  active={settings.warningThreshold === n}
                  onClick={() => updateSetting("warningThreshold", n)}
                />
              ))}
            </div>
            <div style={{ fontSize: "0.78rem", color: colors.mutedText, marginTop: 10 }}>
              The session will stop automatically once you hit this limit.
            </div>
          </SettingCard>

          {/* Face detection timeout */}
          <SettingCard
            title="Face detection timeout"
            description="A warning appears if your face isn't visible for this long"
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { label: "2s", value: 2 },
                { label: "5s", value: 5 },
                { label: "10s", value: 10 },
                { label: "15s", value: 15 },
                { label: "30s", value: 30 },
              ].map(opt => (
                <OptionBtn
                  key={opt.value}
                  label={opt.label}
                  active={settings.faceTimeoutSeconds === opt.value}
                  onClick={() => updateSetting("faceTimeoutSeconds", opt.value)}
                />
              ))}
            </div>
            <div style={{ fontSize: "0.78rem", color: colors.mutedText, marginTop: 10 }}>
              Keep this low if you want stricter monitoring, higher if you need more flexibility.
            </div>
          </SettingCard>

          {/* Theme */}
          <SettingCard
            title="Appearance"
            description="Choose how the app looks"
          >
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "Light", value: "light" },
                { label: "Dark", value: "dark" },
              ].map(opt => (
                <OptionBtn
                  key={opt.value}
                  label={opt.label}
                  active={settings.theme === opt.value}
                  onClick={() => updateSetting("theme", opt.value)}
                />
              ))}
            </div>
            <div style={{ fontSize: "0.78rem", color: colors.mutedText, marginTop: 10 }}>
              Changes apply across the entire app right away.
            </div>
          </SettingCard>

          {/* Danger zone */}
          <SettingCard
            title="Clear all history"
            description="Permanently deletes every interview session you've recorded"
            danger
          >
            <button
              onClick={clearHistory}
              disabled={clearing}
              style={{
                padding: "10px 20px",
                background: "transparent",
                border: "1px solid rgba(192,100,90,0.4)",
                borderRadius: 8,
                color: "#C0645A",
                fontSize: "0.88rem", fontWeight: 600,
                cursor: clearing ? "not-allowed" : "pointer",
                opacity: clearing ? 0.6 : 1,
                transition: "all 0.18s ease",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(192,100,90,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {clearing ? "Clearing..." : "Clear all history"}
            </button>
          </SettingCard>

        </motion.div>
      </div>
    </div>
  );
}

export default Settings;
