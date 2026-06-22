import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiFetch } from "../../config/api";
import Sidebar from "../layouts/Sidebar";

function Performance({ setActivePage, activePage = "performance", theme = "dark", user, onLogout }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === "dark";

  const colors = {
    bg: isDark ? "#0f0f0f" : "#F7F5F2",
    card: isDark ? "#1a1a1a" : "#FFFFFF",
    cardBorder: isDark ? "#2a2a2a" : "#E8E4DE",
    text: isDark ? "#F0EDE8" : "#1C1C1E",
    subtext: isDark ? "#8A8580" : "#6B6560",
    label: isDark ? "#6B6560" : "#9B9590",
    accent: "#D97757",
    tableHead: isDark ? "#141414" : "#FAFAF8",
    tableBorder: isDark ? "#2a2a2a" : "#F0EBE5",
    barTrack: isDark ? "rgba(255,255,255,0.07)" : "#F0EBE5",
    mutedText: isDark ? "#5A5550" : "#B0AAA4",
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  async function fetchHistory() {
    setLoading(true);
    try {
      const res = await apiFetch(`/history`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch {
      const local = JSON.parse(localStorage.getItem("interviewHistory")) || [];
      setHistory(local);
    } finally {
      setLoading(false);
    }
  }

  const total = history.length;

  const avgScore = total
    ? (history.reduce((s, i) => s + (i.final_score ?? i.score ?? 0), 0) / total).toFixed(1)
    : 0;

  const bestScore = total
    ? Math.max(...history.map(i => i.final_score ?? i.score ?? 0))
    : 0;

  const avgEyeContact = total
    ? Math.round(history.reduce((s, i) => s + (i.eye_contact_score ?? 0), 0) / total)
    : 0;

  const avgIntegrity = total
    ? Math.round(history.reduce((s, i) => s + (i.integrity_score ?? 0), 0) / total)
    : 0;

  const roleMap = {};
  history.forEach((item) => {
    const role = item.role || "Unknown";
    const score = item.final_score ?? item.score ?? 0;
    if (!roleMap[role]) roleMap[role] = { total: 0, count: 0 };
    roleMap[role].total += score;
    roleMap[role].count += 1;
  });
  const roleStats = Object.entries(roleMap).map(([role, data]) => ({
    role,
    avg: (data.total / data.count).toFixed(1),
    count: data.count,
  }));

  const trend = [...history].reverse().map((item, i) => ({
    session: i + 1,
    score: item.final_score ?? item.score ?? 0,
  }));

  function scoreColor(score) {
    const s = parseFloat(score);
    if (s >= 8) return "#6A9E6A";
    if (s >= 5) return "#C8A87A";
    return "#C0645A";
  }

  return (
    <div style={{
      display: "flex", height: "100vh", width: "100vw",
      overflow: "hidden",
      background: colors.bg,
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <Sidebar
        setActivePage={setActivePage}
        activePage={activePage}
        theme={theme}
        user={user}
        onLogout={onLogout}
        onNewInterview={() => setActivePage("dashboard")}
      />

      {/* Main */}
      <div style={{ flex: 1, padding: "40px 48px", overflowY: "auto" }}>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ marginBottom: 32 }}
        >
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: colors.text, margin: 0, letterSpacing: "-0.4px" }}>
            Performance
          </h1>
          <p style={{ color: colors.subtext, fontSize: "0.9rem", margin: "6px 0 0" }}>
            {total > 0 ? `Across ${total} session${total !== 1 ? "s" : ""}` : "No sessions yet"}
          </p>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: colors.mutedText, fontSize: "0.9rem" }}>
            Loading your data...
          </div>
        ) : total === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              background: colors.card, borderRadius: 16, padding: "60px 40px",
              textAlign: "center", border: `1px solid ${colors.cardBorder}`,
            }}
          >
            <div style={{ fontSize: "1rem", fontWeight: 600, color: colors.text, marginBottom: 6 }}>
              Nothing to show yet
            </div>
            <div style={{ fontSize: "0.88rem", color: colors.subtext, marginBottom: 24 }}>
              Your performance stats will appear here after you complete an interview.
            </div>
            <button onClick={() => setActivePage("dashboard")} style={{
              padding: "11px 28px", background: colors.accent,
              border: "none", borderRadius: 9,
              color: "#fff", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
            }}>
              Start an interview
            </button>
          </motion.div>
        ) : (
          <>
            {/* Stat cards */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.07 }}
              style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}
            >
              {[
                { label: "Sessions",     value: total              },
                { label: "Avg Score",    value: `${avgScore}/10`  },
                { label: "Best Score",   value: `${bestScore}/10` },
                { label: "Eye Contact",  value: `${avgEyeContact}%` },
                { label: "Integrity",    value: `${avgIntegrity}%`  },
              ].map((stat, i) => (
                <div key={i} style={{
                  flex: "1 1 140px",
                  background: colors.card,
                  borderRadius: 12, padding: "16px 18px",
                  border: `1px solid ${colors.cardBorder}`,
                  boxShadow: isDark ? "none" : "0 2px 10px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: colors.label, marginBottom: 6 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 700, color: i === 0 ? colors.text : colors.accent }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Score Trend */}
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.12 }}
              style={{
                background: colors.card, borderRadius: 14, padding: "24px 28px",
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.04)",
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: colors.text, margin: "0 0 20px" }}>
                Score over time
              </h3>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, overflowX: "auto", paddingBottom: 8 }}>
                {trend.map((point, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 32, gap: 6 }}>
                    <div style={{
                      fontSize: "0.68rem", color: colors.mutedText, fontWeight: 500,
                    }}>
                      {point.score}
                    </div>
                    <div style={{
                      width: 22,
                      height: `${Math.max((point.score / 10) * 100, 4)}px`,
                      background: scoreColor(point.score),
                      borderRadius: "5px 5px 0 0",
                      opacity: 0.85,
                      transition: "height 0.3s ease",
                    }} />
                    <div style={{ fontSize: "0.68rem", color: colors.mutedText, fontWeight: 500 }}>
                      #{point.session}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Skill breakdown */}
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.16 }}
              style={{
                background: colors.card, borderRadius: 14, padding: "24px 28px",
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.04)",
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: colors.text, margin: "0 0 20px" }}>
                Skill breakdown
              </h3>
              {[
                { label: "Average Score", value: avgScore * 10, display: `${avgScore}/10` },
                { label: "Eye Contact",   value: avgEyeContact,  display: `${avgEyeContact}%` },
                { label: "Integrity",     value: avgIntegrity,   display: `${avgIntegrity}%`  },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: i < 2 ? 18 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 500, color: colors.subtext }}>{item.label}</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: colors.accent }}>{item.display}</span>
                  </div>
                  <div style={{ height: 5, background: colors.barTrack, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${item.value}%`,
                      background: colors.accent, borderRadius: 99,
                      transition: "width 0.4s ease",
                      opacity: 0.8,
                    }} />
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Role-wise */}
            {roleStats.length > 0 && (
              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                style={{
                  background: colors.card, borderRadius: 14,
                  border: `1px solid ${colors.cardBorder}`,
                  overflow: "hidden",
                  boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr",
                  padding: "11px 24px", background: colors.tableHead,
                  borderBottom: `1px solid ${colors.tableBorder}`,
                }}>
                  {["Role", "Avg Score", "Sessions"].map(h => (
                    <div key={h} style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: colors.label }}>
                      {h}
                    </div>
                  ))}
                </div>
                {roleStats.map((r, index) => (
                  <div key={index} style={{
                    display: "grid", gridTemplateColumns: "2fr 1fr 1fr",
                    padding: "14px 24px", alignItems: "center",
                    borderBottom: index < roleStats.length - 1 ? `1px solid ${colors.tableBorder}` : "none",
                  }}>
                    <div style={{ fontSize: "0.88rem", fontWeight: 500, color: colors.text }}>{r.role}</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 600, color: scoreColor(r.avg) }}>{r.avg}/10</div>
                    <div style={{ fontSize: "0.83rem", color: colors.subtext }}>{r.count}</div>
                  </div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Performance;
