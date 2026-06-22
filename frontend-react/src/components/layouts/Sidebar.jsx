import { motion } from "framer-motion"
import {
  IconHome, IconClock, IconTrendingUp, IconSettings,
  IconFlame, IconLogOut, IconPlus,
} from "../icons"

function Sidebar({ setActivePage, activePage = "dashboard", theme = "dark", user, onLogout, onNewInterview, streak }) {
  const isDark = theme === "dark"

  const colors = {
    sidebar: isDark ? "#141414" : "#FFFFFF",
    border: isDark ? "#262626" : "#E8E4DE",
    card: isDark ? "#1a1a1a" : "#FAFAF8",
    accent: "#D97757",
    accentSoft: isDark ? "rgba(217,119,87,0.12)" : "rgba(217,119,87,0.08)",
    text: isDark ? "#F0EDE8" : "#1C1C1E",
    muted: isDark ? "#8A8580" : "#6B6560",
    inactiveText: isDark ? "#9A9590" : "#6B6560",
    inactiveIcon: isDark ? "#8A8580" : "#9B9590",
    trackBg: isDark ? "#2a2a2a" : "#EFE9E2",
  }

  const navItems = [
    { key: "dashboard", label: "Dashboard", Icon: IconHome },
    { key: "performance", label: "Performance", Icon: IconTrendingUp },
    { key: "history", label: "History", Icon: IconClock },
    { key: "settings", label: "Settings", Icon: IconSettings },
  ]

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        width: 230,
        minWidth: 230,
        background: colors.sidebar,
        borderRight: `1px solid ${colors.border}`,
        padding: "28px 14px",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        gap: 4,
      }}
    >
      <button
        onClick={() => setActivePage("dashboard")}
        style={{
          background: "none", border: "none", padding: 0, marginBottom: 28,
          display: "flex", alignItems: "center", gap: 10,
          cursor: "pointer", textAlign: "left", width: "fit-content", paddingLeft: 10,
        }}
      >
        <span style={{
          width: 30, height: 30, borderRadius: 8, background: colors.accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.95rem", fontWeight: 800, color: "#fff", flexShrink: 0,
        }}>
          I
        </span>
        <span style={{ fontSize: "1.05rem", fontWeight: 700, color: colors.text }}>
          InterviewAI
        </span>
      </button>

      {navItems.map((nav) => {
        const isActive = activePage === nav.key
        return (
          <button
            key={nav.key}
            onClick={() => setActivePage(nav.key)}
            style={{
              width: "100%", padding: "10px 12px",
              display: "flex", alignItems: "center", gap: 10,
              border: "none", borderRadius: 8,
              background: isActive ? colors.accent : "transparent",
              color: isActive ? "#fff" : colors.inactiveText,
              fontSize: "0.9rem", fontWeight: isActive ? 600 : 400,
              cursor: "pointer", textAlign: "left",
            }}
          >
            <nav.Icon size={17} color={isActive ? "#fff" : colors.inactiveIcon} />
            {nav.label}
          </button>
        )
      })}

      <button
        onClick={onNewInterview}
        style={{
          width: "100%", padding: "11px 12px",
          display: "flex", alignItems: "center", gap: 10,
          border: `1px solid ${colors.accent}`,
          borderRadius: 8, background: "transparent",
          color: colors.accent, fontSize: "0.9rem", fontWeight: 600,
          cursor: "pointer", textAlign: "left", marginTop: 8,
        }}
      >
        <IconPlus size={16} color={colors.accent} />
        New Interview
      </button>

      <div style={{ marginTop: "auto", paddingTop: 16 }}>
        {streak && (
          <div style={{
            background: colors.card, borderRadius: 12, border: `1px solid ${colors.border}`,
            padding: "14px 16px", marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <IconFlame size={16} color={colors.accent} />
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: colors.text }}>
                {streak.current} day{streak.current === 1 ? "" : "s"} streak
              </span>
            </div>
            <div style={{ fontSize: "0.72rem", color: colors.muted, marginBottom: 10 }}>
              Best: {streak.longest} day{streak.longest === 1 ? "" : "s"} · log in or interview daily
            </div>
            <div style={{ height: 5, borderRadius: 3, background: colors.trackBg, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.min(100, (streak.current / 7) * 100)}%`,
                background: colors.accent, borderRadius: 3,
              }} />
            </div>
          </div>
        )}

        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 16 }}>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{
                width: 28, height: 28, borderRadius: "50%", background: colors.accentSoft,
                color: colors.accent, display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: "0.78rem", flexShrink: 0,
              }}>
                {user.name?.[0]?.toUpperCase() || "?"}
              </span>
              <span style={{ color: colors.inactiveText, fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name}
              </span>
            </div>
          )}
          {onLogout && (
            <button onClick={onLogout} style={{
              width: "100%", padding: "10px 12px",
              display: "flex", alignItems: "center", gap: 10,
              border: "1px solid #3a2020", borderRadius: 8,
              background: "transparent", color: "#C0645A",
              fontSize: "0.87rem", fontWeight: 500,
              cursor: "pointer", textAlign: "left",
            }}>
              <IconLogOut size={15} color="#C0645A" />
              Sign out
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default Sidebar
