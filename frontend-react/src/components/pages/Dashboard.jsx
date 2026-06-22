import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "../../config/api";
import {
  IconHome, IconClock, IconTrendingUp, IconSettings, IconCalendar,
  IconStar, IconFlame, IconLogOut, IconPlus, IconEye, IconMic,
  IconList, IconBulb, IconHeart,
} from "../icons";

// Builds 7 day buckets (oldest -> newest) and averages scores that fall on each day.
function buildLast7Days(history) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({
      date: d,
      label: d.toLocaleDateString(undefined, { day: "2-digit", month: "short" }),
      scores: [],
    });
  }
  history.forEach((h) => {
    if (!h.created_at) return;
    const created = new Date(h.created_at);
    const match = days.find((day) => created.toDateString() === day.date.toDateString());
    if (match) match.scores.push(Number(h.final_score ?? h.score ?? 0));
  });
  return days.map((day) => ({
    label: day.label,
    value: day.scores.length ? day.scores.reduce((a, b) => a + b, 0) / day.scores.length : 0,
  }));
}

// Small inline sparkline — no chart library needed, scores are always 0-10.
function MiniLineChart({ data, color, gridColor }) {
  const width = 700;
  const height = 150;
  const padding = 16;
  const max = 10;
  const stepX = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: padding + i * stepX,
    y: height - padding - (Math.min(d.value, max) / max) * (height - padding * 2),
    value: d.value,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - padding} L ${points[0].x.toFixed(1)} ${height - padding} Z`
    : "";
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="dashChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 2.5, 5, 7.5, 10].map((g, i) => {
        const y = height - padding - (g / max) * (height - padding * 2);
        return <line key={i} x1={padding} x2={width - padding} y1={y} y2={y} stroke={gridColor} strokeWidth="1" strokeDasharray="3 5" />;
      })}
      {points.length > 0 && <path d={areaPath} fill="url(#dashChartFill)" stroke="none" />}
      {points.length > 0 && <path d={linePath} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 5 : 3}
          fill={i === points.length - 1 ? color : "#1a1a1a"}
          stroke={color}
          strokeWidth="1.6"
        />
      ))}
      {last && (
        <text x={last.x} y={Math.max(14, last.y - 14)} textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>
          {last.value.toFixed(1)}
        </text>
      )}
    </svg>
  );
}

function Dashboard({
  onStart,
  setActivePage,
  activePage = "dashboard",
  theme = "dark",
  onLogout,
  user
}) {
  const [difficulty, setDifficulty] = useState("Easy");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("Software Engineer");
  const [stats, setStats] = useState({ total: 0, avgScore: 0, lastScore: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [recentSessions, setRecentSessions] = useState([]);
  const [chartData, setChartData] = useState(buildLast7Days([]));
  const [streak, setStreak] = useState({ current: 0, longest: 0 });

  const isDark = theme === "dark";

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
    mutedText: isDark ? "#5A5550" : "#B0AAA4",
    overlay: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)",
    good: "#4A7C59",
    warn: "#B5894A",
    danger: "#A0524A",
    trackBg: isDark ? "#2a2a2a" : "#EFE9E2",
  };

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const [histRes, streakRes] = await Promise.all([
        apiFetch(`/history`),
        apiFetch(`/streak`),
      ]);

      const histData = await histRes.json();
      const history = histData.history || [];

      if (streakRes.ok) {
        const streakData = await streakRes.json();
        setStreak({
          current: streakData.current_streak || 0,
          longest: streakData.longest_streak || 0,
        });
      }

      if (history.length > 0) {
        const scores = history.map(h => h.final_score ?? h.score ?? 0);
        const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
        setStats({
          total: history.length,
          avgScore: avg,
          lastScore: scores[0],
        });
        setRecentSessions(history.slice(0, 3));
      } else {
        setStats({ total: 0, avgScore: 0, lastScore: 0 });
        setRecentSessions([]);
      }
      setChartData(buildLast7Days(history));
    } catch (e) {
      // silent
    } finally {
      setStatsLoading(false);
    }
  }

  async function startInterview() {
    setLoading(true);
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (e) {
        console.error("Fullscreen error:", e);
      }
    }
    try {
      const res = await fetch(
        `https://ai-interview-assistant-2-hgo9.onrender.com/start-session?role=${encodeURIComponent(role)}&difficulty=${encodeURIComponent(difficulty)}`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to start session");
      const data = await res.json();
      onStart(data.role, data.session_id, data.question, difficulty);
    } catch (err) {
      alert("Could not start the interview. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  const navItems = [
    { key: "dashboard", label: "Dashboard", Icon: IconHome },
    { key: "performance", label: "Performance", Icon: IconTrendingUp },
    { key: "history", label: "History", Icon: IconClock },
    { key: "settings", label: "Settings", Icon: IconSettings },
  ];

  const tips = [
    { title: "Eye Contact", desc: "Look directly at the camera when speaking to appear confident.", Icon: IconEye },
    { title: "Speak Clearly", desc: "Articulate your words and avoid filler words like 'um' or 'uh'.", Icon: IconMic },
    { title: "Be Concise", desc: "Answer the question directly without unnecessary elaboration.", Icon: IconList },
    { title: "Think First", desc: "Take a moment to collect your thoughts before responding.", Icon: IconBulb },
    { title: "Stay Positive", desc: "Maintain a positive attitude and show enthusiasm.", Icon: IconHeart },
  ];

  const scoreColor = (score) => {
    try {
      const s = parseFloat(score);
      if (s >= 8) return colors.good;
      if (s >= 5) return colors.warn;
      return colors.danger;
    } catch {
      return colors.mutedText;
    }
  };

  const statCards = [
    {
      label: "Sessions Completed",
      value: stats.total,
      Icon: IconCalendar,
      caption: stats.total > 0 ? "Keep going!" : "Start your first one!",
      color: colors.text,
    },
    {
      label: "Average Score",
      value: `${stats.avgScore}/10`,
      Icon: IconTrendingUp,
      caption: parseFloat(stats.avgScore) >= 7 ? "Great consistency!" : "Let's improve this!",
      color: scoreColor(stats.avgScore),
    },
    {
      label: "Last Score",
      value: `${stats.lastScore}/10`,
      Icon: IconStar,
      caption: parseFloat(stats.lastScore) >= 7 ? "Nice work!" : "You can do better!",
      color: scoreColor(stats.lastScore),
    },
  ];

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      width: "100vw",
      overflow: "hidden",
      background: colors.bg,
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .nav-btn { transition: all 0.18s ease; }
        .nav-btn:hover { background: ${isDark ? "#222222" : "#F0EDE8"} !important; }
        .icon-btn { transition: all 0.18s ease; }
        .icon-btn:hover { border-color: ${colors.accent} !important; }
      `}</style>

      {/* Sidebar */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          width: 230,
          minWidth: 230,
          background: colors.sidebar,
          borderRight: `1px solid ${colors.sidebarBorder}`,
          padding: "28px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, paddingLeft: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: colors.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: "0.95rem",
          }}>
            I
          </div>
          <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#F0EDE8" }}>InterviewAI</span>
        </div>

        {navItems.map((nav) => {
          const isActive = activePage === nav.key;
          return (
            <button key={nav.key} className="nav-btn" onClick={() => setActivePage(nav.key)} style={{
              width: "100%", padding: "10px 12px",
              display: "flex", alignItems: "center", gap: 10,
              border: "none", borderRadius: 8,
              background: isActive ? colors.accent : "transparent",
              color: isActive ? "#fff" : "#9A9590",
              fontSize: "0.9rem", fontWeight: isActive ? 600 : 400,
              cursor: "pointer", textAlign: "left",
            }}>
              <nav.Icon size={17} color={isActive ? "#fff" : "#8A8580"} />
              {nav.label}
            </button>
          );
        })}

        <button className="nav-btn" onClick={() => setShowModal(true)} style={{
          width: "100%", padding: "11px 12px",
          display: "flex", alignItems: "center", gap: 10,
          border: `1px solid ${colors.accent}`,
          borderRadius: 8, background: "transparent",
          color: colors.accent, fontSize: "0.9rem", fontWeight: 600,
          cursor: "pointer", textAlign: "left", marginTop: 8,
        }}>
          <IconPlus size={16} color={colors.accent} />
          New Interview
        </button>

        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          {/* Daily streak widget */}
          <div style={{
            background: colors.card, borderRadius: 12, border: `1px solid ${colors.cardBorder}`,
            padding: "14px 16px", marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <IconFlame size={16} color={colors.accent} />
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: colors.text }}>
                {streak.current} day{streak.current === 1 ? "" : "s"} streak
              </span>
            </div>
            <div style={{ fontSize: "0.72rem", color: colors.mutedText, marginBottom: 10 }}>
              Best: {streak.longest} day{streak.longest === 1 ? "" : "s"} · log in or interview daily
            </div>
            <div style={{ height: 5, borderRadius: 3, background: colors.trackBg, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.min(100, (streak.current / 7) * 100)}%`,
                background: colors.accent, borderRadius: 3,
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${colors.sidebarBorder}`, paddingTop: 16 }}>
            {user && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", background: colors.accentSoft,
                  color: colors.accent, display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: "0.78rem", flexShrink: 0,
                }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div style={{ color: "#9A9590", fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name}
                </div>
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
                transition: "all 0.18s ease",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(192,100,90,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <IconLogOut size={15} color="#C0645A" />
                Sign out
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div style={{ flex: 1, padding: "40px 48px", overflowY: "auto", paddingBottom: 60 }}>

        {/* Header */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 32 }}
        >
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: colors.text, margin: 0, letterSpacing: "-0.4px" }}>
              Hey{user ? `, ${user.name.split(" ")[0]}` : ""} 👋
            </h1>
            <p style={{ color: colors.subtext, fontSize: "0.9rem", margin: "6px 0 0" }}>
              Welcome back. Ready for your next interview?
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="icon-btn" onClick={() => setActivePage("performance")} style={{
              padding: "11px 18px", display: "flex", alignItems: "center", gap: 8,
              background: colors.card, color: colors.text,
              border: `1px solid ${colors.cardBorder}`, borderRadius: 10,
              fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
            }}>
              <IconTrendingUp size={15} color={colors.text} />
              View Analytics
            </button>
            <button onClick={() => setShowModal(true)} style={{
              padding: "11px 18px", display: "flex", alignItems: "center", gap: 8,
              background: colors.accent, color: "#fff",
              border: "none", borderRadius: 10,
              fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
              transition: "all 0.18s ease",
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <IconPlus size={15} color="#fff" />
              Start New Interview
            </button>
          </div>
        </motion.div>

        {/* Stats Row */}
        {!statsLoading && (
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            style={{ display: "flex", gap: 14, marginBottom: 32, flexWrap: "wrap" }}
          >
            {statCards.map((stat, i) => (
              <div key={i} style={{
                flex: "1 1 200px",
                background: colors.card,
                borderRadius: 12, padding: "18px 20px",
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: isDark ? "none" : "0 2px 10px rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: colors.label }}>
                    {stat.label}
                  </div>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, background: colors.accentSoft,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <stat.Icon size={15} color={colors.accent} />
                  </div>
                </div>
                <div style={{ fontSize: "1.55rem", fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "0.74rem", color: colors.mutedText, marginTop: 6 }}>
                  {stat.caption}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Two Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>

         {/* Recent Sessions */}
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: colors.text, margin: 0 }}>
                Recent Sessions
              </h2>
              <button onClick={() => setActivePage("history")} style={{
                background: "none", border: "none", color: colors.accent,
                fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", padding: 0,
              }}>
                View all →
              </button>
            </div>
            <div style={{ background: colors.card, borderRadius: 12, border: `1px solid ${colors.cardBorder}`, overflow: "hidden" }}>
              {recentSessions.length > 0 ? (
                recentSessions.map((session, i) => (
                  <div key={i} style={{
                    padding: "14px 16px",
                    borderBottom: i < recentSessions.length - 1 ? `1px solid ${colors.cardBorder}` : "none",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 500, color: colors.text, marginBottom: 3 }}>
                        {session.role}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: colors.mutedText }}>
                        {session.difficulty} · {new Date(session.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{
                      fontSize: "1rem", fontWeight: 700,
                      color: scoreColor(session.final_score ?? session.score ?? 0),
                    }}>
                      {session.final_score ?? session.score ?? 0}/10
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: "20px 16px", textAlign: "center", color: colors.mutedText, fontSize: "0.85rem" }}>
                  No sessions yet. Start your first interview!
                </div>
              )}
            </div>
          </motion.div>

          {/* Tips Section */}
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.25 }}
          >
            <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: colors.text, marginBottom: 14 }}>
              Interview Tips
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tips.map((tip, i) => (
                <div key={i} style={{
                  display: "flex", gap: 12,
                  background: colors.card,
                  borderRadius: 12,
                  border: `1px solid ${colors.cardBorder}`,
                  padding: "14px 16px",
                }}>
                  <div style={{
                    width: 32, height: 32, minWidth: 32, borderRadius: 8, background: colors.accentSoft,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <tip.Icon size={15} color={colors.accent} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: colors.accent, marginBottom: 4 }}>
                      {tip.title}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: colors.subtext, lineHeight: 1.5 }}>
                      {tip.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Performance Overview */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.3 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: colors.text, margin: 0 }}>
              Performance Overview
            </h2>
            <span style={{ fontSize: "0.75rem", color: colors.mutedText }}>Last 7 days</span>
          </div>
          <div style={{ background: colors.card, borderRadius: 12, border: `1px solid ${colors.cardBorder}`, padding: "20px 24px 12px" }}>
            <MiniLineChart data={chartData} color={colors.accent} gridColor={colors.trackBg} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              {chartData.map((d, i) => (
                <span key={i} style={{ fontSize: "0.65rem", color: colors.mutedText }}>{d.label}</span>
              ))}
            </div>
          </div>
        </motion.div>

      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            style={{
              position: "fixed", inset: 0,
              background: colors.overlay,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 1000, padding: "20px",
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                position: "relative",
                background: colors.card,
                borderRadius: 16,
                padding: "36px 40px",
                border: `1px solid ${colors.cardBorder}`,
                maxWidth: 520,
                width: "100%",
                boxShadow: isDark ? "0 20px 60px rgba(0,0,0,0.4)" : "0 20px 60px rgba(0,0,0,0.12)",
              }}
            >
              <button onClick={() => setShowModal(false)} style={{
                position: "absolute", right: 20, top: 20,
                width: 28, height: 28,
                border: "none", background: colors.accentSoft,
                borderRadius: 6, color: colors.accent,
                fontSize: "1.2rem", cursor: "pointer",
              }}>
                ✕
              </button>

              <h2 style={{
                fontSize: "1.3rem", fontWeight: 700, color: colors.text,
                margin: "0 0 24px", letterSpacing: "-0.3px",
              }}>
                Start New Interview
              </h2>

              {/* Role */}
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  fontSize: "0.8rem", fontWeight: 600, color: colors.label,
                  textTransform: "uppercase", letterSpacing: "0.6px",
                  display: "block", marginBottom: 8,
                }}>
                  Role
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    style={{
                      width: "100%", padding: "11px 14px",
                      border: `1px solid ${colors.cardBorder}`, borderRadius: 10,
                      fontSize: "0.95rem", fontWeight: 500, color: colors.text,
                      background: isDark ? "#222222" : "#FAFAF8",
                      cursor: "pointer", paddingRight: 36,
                    }}
                  >
                    <optgroup label="Software Development">
                      <option>Software Engineer</option>
                      <option>Frontend Developer</option>
                      <option>Backend Developer</option>
                      <option>Full Stack Developer</option>
                    </optgroup>
                    <optgroup label="AI & Data">
                      <option>Data Scientist</option>
                      <option>Data Analyst</option>
                      <option>ML Engineer</option>
                    </optgroup>
                    <optgroup label="Cloud & DevOps">
                      <option>DevOps Engineer</option>
                      <option>Cloud Engineer</option>
                    </optgroup>
                    <optgroup label="Security">
                      <option>Cyber Security Engineer</option>
                    </optgroup>
                    <optgroup label="Mobile">
                      <option>Android Developer</option>
                      <option>iOS Developer</option>
                      <option>Mobile App Developer</option>
                    </optgroup>
                    <optgroup label="Design">
                      <option>UI/UX Designer</option>
                    </optgroup>
                    <optgroup label="Management">
                      <option>Product Manager</option>
                      <option>Project Manager</option>
                      <option>Business Analyst</option>
                    </optgroup>
                    <optgroup label="HR">
                      <option>HR</option>
                      <option>Technical Recruiter</option>
                    </optgroup>
                  </select>
                  <span style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)", color: colors.label,
                    pointerEvents: "none", fontSize: "0.75rem",
                  }}>▼</span>
                </div>
              </div>

           {/* Difficulty */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  fontSize: "0.8rem", fontWeight: 600, color: colors.label,
                  textTransform: "uppercase", letterSpacing: "0.6px",
                  display: "block", marginBottom: 8,
                }}>
                  Difficulty
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Easy", "Medium", "Hard"].map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      style={{
                        padding: "9px 20px",
                        border: difficulty === d
                          ? `1.5px solid ${colors.accent}`
                          : `1px solid ${colors.cardBorder}`,
                        borderRadius: 8,
                        background: difficulty === d ? colors.accentSoft : "transparent",
                        color: difficulty === d ? colors.accent : colors.subtext,
                        fontSize: "0.9rem",
                        fontWeight: difficulty === d ? 600 : 400,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div style={{
                background: colors.accentSoft,
                border: `1px solid rgba(217,119,87,0.25)`,
                borderRadius: 10, padding: "14px 16px",
                marginBottom: 24,
              }}>
                <div style={{
                  fontSize: "0.75rem", fontWeight: 600, color: colors.accent,
                  textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10,
                }}>
                  Before you start
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: "0.82rem", lineHeight: 1.6, color: colors.subtext }}>
                  <li style={{ marginBottom: 5 }}>Camera should see your face clearly</li>
                  <li style={{ marginBottom: 5 }}>Speak naturally and clearly</li>
                  <li style={{ marginBottom: 5 }}>Think before responding</li>
                  <li style={{ marginBottom: 5 }}>Stay in camera frame</li>
                  <li>Questions match your role & difficulty</li>
                </ul>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={startInterview}
                  disabled={loading}
                  style={{
                    flex: 1, padding: "12px", border: "none", borderRadius: 10,
                    background: colors.accent, color: "#fff",
                    fontSize: "0.9rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1, transition: "all 0.18s ease",
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.9"; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.opacity = "1"; }}
                >
                  {loading ? "Starting..." : "Start Interview"}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 0.5, padding: "12px", border: `1px solid ${colors.cardBorder}`,
                    borderRadius: 10, background: "transparent",
                    color: colors.mutedText, fontSize: "0.9rem", fontWeight: 500,
                    cursor: "pointer", transition: "all 0.18s ease",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = colors.accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor = colors.cardBorder}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;
